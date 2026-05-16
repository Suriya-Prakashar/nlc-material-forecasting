import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Do not set Content-Type for FormData — the browser must add the multipart boundary.
      const response = await api.post("/api/upload", formData);
      
      if (response.data && response.data.data) {
        onUploadSuccess(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-nlcBlue bg-blue-50' : 'border-gray-300 hover:border-nlcBlue hover:bg-gray-50'}
          ${file ? 'bg-blue-50/50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-nlcBlue mb-4" />
            <p className="text-lg font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">Drag & drop your file here</p>
            <p className="text-sm text-gray-500 mt-2">or click to browse from your computer</p>
            <p className="text-xs text-gray-400 mt-4">Supported: CSV, Excel, or PDF (NLC movement export)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        {file && (
          <button
            onClick={() => setFile(null)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-6 py-2 text-sm font-medium text-white rounded flex items-center justify-center min-w-[120px] transition-colors
            ${!file || uploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-nlcBlue hover:bg-blue-800'}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Generate Forecast'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
