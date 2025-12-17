# NoteMitra Server Keeper - Ensures servers stay alive
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          NOTEMITRA - STARTING SERVERS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes on our ports
Write-Host "Cleaning up old processes..." -ForegroundColor Gray
Get-NetTCPConnection -LocalPort 3000,5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# Function to start backend with auto-restart
$backendScript = {
    Set-Location "C:\notemitra1\server"
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting Backend..." -ForegroundColor Cyan
        node server-enhanced.js
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backend stopped. Restarting in 2s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

# Function to start frontend with auto-restart
$frontendScript = {
    Set-Location "C:\notemitra1\client"
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting Frontend..." -ForegroundColor Cyan
        npm run dev
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Frontend stopped. Restarting in 2s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

# Start backend in new PowerShell window
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { $backendScript }" -WindowStyle Minimized

# Wait for backend
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start frontend in new PowerShell window
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { $frontendScript }" -WindowStyle Minimized

# Wait for frontend
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          SERVERS STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Servers are running in minimized windows." -ForegroundColor Yellow
Write-Host "They will auto-restart if they crash." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: Close the minimized PowerShell windows" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Monitor loop
while ($true) {
    Start-Sleep -Seconds 30
    
    # Check backend
    try {
        $backend = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backend: OK (200)" -ForegroundColor Green
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backend: ERROR" -ForegroundColor Red
    }
    
    # Check frontend
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Frontend: OK (200)" -ForegroundColor Green
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Frontend: ERROR" -ForegroundColor Red
    }
}
