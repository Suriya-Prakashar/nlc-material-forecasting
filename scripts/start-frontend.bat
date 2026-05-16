@echo off
cd /d "%~dp0..\frontend"
if not exist "node_modules\" (
  echo [Frontend] Installing npm dependencies ^(first run only^)...
  call npm install
  if errorlevel 1 (
    echo [Frontend] ERROR: npm install failed.
    pause
    exit /b 1
  )
)
echo [Frontend] Starting on http://localhost:5173
echo [Frontend] Close this window to stop the server.
call npm run dev
pause
