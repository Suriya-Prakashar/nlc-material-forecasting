@echo off
cd /d "%~dp0..\backend"
if not exist "venv\Scripts\activate.bat" (
  echo [Backend] Creating virtual environment...
  python -m venv venv
  if errorlevel 1 (
    echo [Backend] ERROR: python not found. Install Python and add it to PATH.
    pause
    exit /b 1
  )
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
) else (
  call venv\Scripts\activate.bat
)
echo [Backend] Starting on http://localhost:8001
echo [Backend] Close this window to stop the server.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
pause
