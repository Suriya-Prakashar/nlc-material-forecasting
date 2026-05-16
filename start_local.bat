@echo off
title NLC Material Forecasting - Launcher
cd /d "%~dp0"

echo.
echo  Starting Backend and Frontend in separate windows...
echo  - Backend:  http://localhost:8001
echo  - Frontend: http://localhost:5173
echo.
echo  Close each window to stop that server.
echo.

start "NLC Backend (8001)" cmd /k call "%~dp0scripts\start-backend.bat"
timeout /t 2 /nobreak >nul
start "NLC Frontend (5173)" cmd /k call "%~dp0scripts\start-frontend.bat"

echo  Opening browser in a few seconds...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173/"

echo.
echo  Done. You can close this launcher window.
echo.
pause
