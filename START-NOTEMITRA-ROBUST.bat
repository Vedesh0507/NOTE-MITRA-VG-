@echo off
title NoteMitra - Server Manager
color 0E
cls

echo.
echo ============================================================
echo            NOTEMITRA - STARTING SERVERS
echo ============================================================
echo.
echo This window will keep both servers running automatically.
echo If a server crashes, it will restart immediately.
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo ============================================================
echo.

REM Kill any existing node processes on these ports
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Backend in new window
echo Starting Backend Server...
start "NoteMitra Backend - Port 5000" /MIN cmd /c "cd /d C:\notemitra1\server && color 0B && :loop && node server-enhanced.js && echo Backend crashed! Restarting... && timeout /t 2 /nobreak >nul && goto loop"

REM Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start Frontend in new window  
echo Starting Frontend Server...
start "NoteMitra Frontend - Port 3000" /MIN cmd /c "cd /d C:\notemitra1\client && color 0A && :loop && npm run dev && echo Frontend crashed! Restarting... && timeout /t 2 /nobreak >nul && goto loop"

REM Wait for frontend to initialize
echo Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo.
echo ============================================================
echo            SERVERS STARTED SUCCESSFULLY!
echo ============================================================
echo.
echo Backend API:  http://localhost:5000/api/health
echo Frontend:     http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:3000

echo.
echo ============================================================
echo Both servers are now running in minimized windows.
echo They will auto-restart if they crash.
echo.
echo To view server logs: Check the minimized windows on taskbar
echo To stop servers: Close this window or press Ctrl+C
echo ============================================================
echo.
echo Press any key to open server monitoring...
pause >nul

REM Show the server windows
echo Showing server windows...
start http://localhost:5000/api/health

:monitor
cls
echo.
echo ============================================================
echo            NOTEMITRA - SERVER MONITOR
echo ============================================================
echo.
echo Checking server status...
echo.

REM Check backend
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo Backend:  RUNNING ✓  http://localhost:5000
) else (
    echo Backend:  DOWN ✗  http://localhost:5000
)

REM Check frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo Frontend: RUNNING ✓  http://localhost:3000
) else (
    echo Frontend: DOWN ✗  http://localhost:3000
)

echo.
echo Last check: %date% %time%
echo.
echo Press Ctrl+C to stop servers, or wait for next check...
timeout /t 10 >nul
goto monitor
