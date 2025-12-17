@echo off
title NoteMitra - Starting All Services
color 0B
echo.
echo ========================================
echo   STARTING NOTEMITRA PLATFORM
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "" "C:\notemitra1\server\start-server.bat"
timeout /t 3 /nobreak

echo [2/2] Starting Frontend Server (Port 3000)...
start "" "C:\notemitra1\client\start-frontend.bat"
timeout /t 5 /nobreak

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000/api
echo.
echo Press any key to open website in browser...
pause >nul

start http://localhost:3000

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
