import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  const [data, setData] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-nlcBlue text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Material Demand Forecasting</h1>
            <p className="text-sm text-blue-200 mt-1">NLC India Limited - Budget Optimization</p>
          </div>
          <div className="hidden md:block">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">Dashboard</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col gap-8">
        {!data ? (
          <div className="mt-12 w-full max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Upload Historical Data</h2>
            <p className="text-gray-500 mb-4 text-center text-sm">
              Upload CSV/Excel (monthly summary) or a PDF material movement report — both support M001 and M002.
            </p>
            <p className="text-gray-400 mb-8 text-center text-xs">
              CSV columns: Plant, Month_Year, Total_Qty_KG, Total_Amount_INR, Records (M001 and M002). PDF also supported.
            </p>
            <FileUpload onUploadSuccess={setData} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Forecast & Optimization Results</h2>
              <button 
                onClick={() => setData(null)}
                className="px-4 py-2 text-sm text-nlcBlue bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Upload New Data
              </button>
            </div>
            <Dashboard data={data} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} NLC India Limited. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
