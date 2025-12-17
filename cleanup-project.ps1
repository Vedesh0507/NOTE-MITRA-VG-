# ============================================
# NoteMitra - Safe Project Cleanup Script
# ============================================
# This script removes all unnecessary files while preserving source code
# Run this from the project root: C:\NM_final
# ============================================

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NoteMitra Project Cleanup Utility" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
Write-Host "⚠️  WARNING: This will delete:" -ForegroundColor Yellow
Write-Host "   - node_modules folders (~608 MB)" -ForegroundColor Yellow
Write-Host "   - .next build cache (~93 MB)" -ForegroundColor Yellow
Write-Host "   - dist/build outputs" -ForegroundColor Yellow
Write-Host "   - Log files" -ForegroundColor Yellow
Write-Host "   - Cache files" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ This will PRESERVE:" -ForegroundColor Green
Write-Host "   - All source code" -ForegroundColor Green
Write-Host "   - Configuration files" -ForegroundColor Green
Write-Host "   - Documentation" -ForegroundColor Green
Write-Host "   - package.json & package-lock.json" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Do you want to continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "`n❌ Cleanup cancelled." -ForegroundColor Red
    exit
}

Write-Host "`n🚀 Starting cleanup process..." -ForegroundColor Cyan
Write-Host ""

# Function to safely remove directory
function Remove-SafeDirectory {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        Write-Host "🗑️  Removing $Description..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ Deleted: $Path" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not delete: $Path" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   ℹ️  Not found: $Path (skipping)" -ForegroundColor Gray
    }
}

# Function to count files
function Get-FileCount {
    param($Path)
    
    $count = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.FullName -notmatch '\\node_modules\\' -and 
            $_.FullName -notmatch '\\.next\\' -and 
            $_.FullName -notmatch '\\dist\\' 
        } | Measure-Object).Count
    
    return $count
}

# ============================================
# Step 1: Count files before cleanup
# ============================================
Write-Host "`n📊 STEP 1: Analyzing current state..." -ForegroundColor Cyan
$beforeCount = Get-FileCount "C:\NM_final"
Write-Host "   Current source files: $beforeCount" -ForegroundColor White
Write-Host ""

# ============================================
# Step 2: Stop running processes
# ============================================
Write-Host "📊 STEP 2: Stopping Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    Write-Host "   Stopping processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✅ All Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No running Node.js processes found" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Step 3: Delete dependency folders
# ============================================
Write-Host "📊 STEP 3: Removing dependency folders..." -ForegroundColor Cyan
Remove-SafeDirectory "C:\NM_final\client\node_modules" "Frontend dependencies (node_modules)"
Remove-SafeDirectory "C:\NM_final\server\node_modules" "Backend dependencies (node_modules)"
Write-Host ""

# ============================================
# Step 4: Delete build outputs
# ============================================
Write-Host "📊 STEP 4: Removing build outputs..." -ForegroundColor Cyan
Remove-SafeDirectory "C:\NM_final\client\.next" "Next.js build cache (.next)"
Remove-SafeDirectory "C:\NM_final\client\out" "Next.js static export (out)"
Remove-SafeDirectory "C:\NM_final\server\dist" "Backend build output (dist)"
Remove-SafeDirectory "C:\NM_final\server\build" "Backend build output (build)"
Write-Host ""

# ============================================
# Step 5: Delete cache and temp files
# ============================================
Write-Host "📊 STEP 5: Removing cache and temp files..." -ForegroundColor Cyan
Remove-SafeDirectory "C:\NM_final\.turbo" "Turbo cache"
Remove-SafeDirectory "C:\NM_final\.cache" "General cache"
Remove-SafeDirectory "C:\NM_final\client\.cache" "Frontend cache"
Remove-SafeDirectory "C:\NM_final\server\.cache" "Backend cache"
Remove-SafeDirectory "C:\NM_final\temp" "Temporary files"
Write-Host ""

# ============================================
# Step 6: Delete log files
# ============================================
Write-Host "📊 STEP 6: Removing log files..." -ForegroundColor Cyan
$logFiles = Get-ChildItem -Path "C:\NM_final" -Recurse -Include "*.log" -File -ErrorAction SilentlyContinue
if ($logFiles) {
    Write-Host "   Found $($logFiles.Count) log file(s)" -ForegroundColor Yellow
    foreach ($log in $logFiles) {
        try {
            Remove-Item $log.FullName -Force
            Write-Host "   ✅ Deleted: $($log.Name)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not delete: $($log.Name)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ℹ️  No log files found" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Step 7: Delete OS-specific files
# ============================================
Write-Host "📊 STEP 7: Removing OS-specific files..." -ForegroundColor Cyan
$osFiles = Get-ChildItem -Path "C:\NM_final" -Recurse -Include ".DS_Store","Thumbs.db","Desktop.ini" -File -ErrorAction SilentlyContinue
if ($osFiles) {
    Write-Host "   Found $($osFiles.Count) OS file(s)" -ForegroundColor Yellow
    foreach ($file in $osFiles) {
        try {
            Remove-Item $file.FullName -Force
            Write-Host "   ✅ Deleted: $($file.Name)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not delete: $($file.Name)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ℹ️  No OS-specific files found" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Step 8: Count files after cleanup
# ============================================
Write-Host "📊 STEP 8: Analyzing results..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
$afterCount = Get-FileCount "C:\NM_final"
Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CLEANUP COMPLETE! ✅" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Results:" -ForegroundColor Cyan
Write-Host "   Before: $beforeCount source files" -ForegroundColor White
Write-Host "   After:  $afterCount source files" -ForegroundColor White
Write-Host "   Status: " -NoNewline -ForegroundColor White

if ($afterCount -le 200) {
    Write-Host "✅ Optimal (<200 files)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Review remaining files" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Reinstall dependencies:" -ForegroundColor White
Write-Host "      cd client && npm ci" -ForegroundColor Gray
Write-Host "      cd ..\server && npm ci" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Start development servers:" -ForegroundColor White
Write-Host "      Backend:  cd server && npm run enhanced" -ForegroundColor Gray
Write-Host "      Frontend: cd client && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verify everything works at:" -ForegroundColor White
Write-Host "      Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "      Backend:  http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to reinstall dependencies now
Write-Host "Do you want to reinstall dependencies now? (yes/no): " -ForegroundColor Yellow -NoNewline
$reinstall = Read-Host

if ($reinstall -eq "yes") {
    Write-Host "`n🔄 Reinstalling dependencies..." -ForegroundColor Cyan
    Write-Host ""
    
    # Frontend
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location "C:\NM_final\client"
    npm ci
    
    Write-Host ""
    
    # Backend
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location "C:\NM_final\server"
    npm ci
    
    # Return to root
    Set-Location "C:\NM_final"
    
    Write-Host ""
    Write-Host "✅ Dependencies reinstalled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the servers:" -ForegroundColor Cyan
    Write-Host "   Backend:  .\start-backend.bat" -ForegroundColor Gray
    Write-Host "   Frontend: .\start-frontend.bat" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ℹ️  Remember to reinstall dependencies before running the app!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
