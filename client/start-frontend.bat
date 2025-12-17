@echo off
title NoteMitra Frontend - Port 3000
color 0A
cd /d C:\notemitra1\client
echo.
echo ========================================
echo   NOTEMITRA FRONTEND STARTING
echo ========================================
echo.
echo Starting Next.js on http://localhost:3000
echo.
:start
npm run dev
echo.
echo Frontend crashed! Restarting in 5 seconds...
timeout /t 5 /nobreak
goto start
