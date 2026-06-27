@echo off
REM Kill any existing PHP processes from a prior dev session
taskkill /F /IM php.exe 2>nul >nul

timeout /t 2 /nobreak >nul

cd /d "%~dp0my-app"
echo.
echo ========================================
echo Starting DisasterTraining Dev Environment
echo ========================================
echo.
echo Laravel:  http://127.0.0.1:8000
echo Vite HMR: http://127.0.0.1:5177
echo.
echo Press Ctrl+C to stop all services
echo.
composer run dev

pause
