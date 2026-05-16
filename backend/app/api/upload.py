from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.ml.forecasting import process_and_forecast

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save file to uploads directory
        file_location = f"uploads/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # Process the file and generate forecast
        result = process_and_forecast(file_location)
        
        return {"filename": file.filename, "message": "File processed successfully", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
