# ============================================
# NoteMitra - Project Health Check Script
# ============================================
# Verifies project structure and readiness
# ============================================

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NoteMitra Project Health Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = @()

# Function to check directory
function Test-Directory {
    param($Path, $Name, $ShouldExist = $true)
    
    $exists = Test-Path $Path
    
    if ($ShouldExist -and $exists) {
        $script:passed += "✅ $Name exists"
        return $true
    } elseif (-not $ShouldExist -and -not $exists) {
        $script:passed += "✅ $Name correctly absent"
        return $true
    } elseif ($ShouldExist -and -not $exists) {
        $script:errors += "❌ $Name missing"
        return $false
    } else {
        $script:warnings += "⚠️  $Name exists (should be deleted)"
        return $false
    }
}

# Function to check file
function Test-FileExists {
    param($Path, $Name, $Required = $true)
    
    $exists = Test-Path $Path
    
    if ($exists) {
        $script:passed += "✅ $Name exists"
        return $true
    } else {
        if ($Required) {
            $script:errors += "❌ $Name missing (required)"
        } else {
            $script:warnings += "⚠️  $Name missing (recommended)"
        }
        return $false
    }
}

Write-Host "🔍 Checking project structure..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# Check Essential Directories
# ============================================
Write-Host "📁 Essential Directories:" -ForegroundColor Yellow
Test-Directory "C:\NM_final\client" "Client folder" $true
Test-Directory "C:\NM_final\server" "Server folder" $true
Test-Directory "C:\NM_final\client\app" "Frontend app folder" $true
Test-Directory "C:\NM_final\client\components" "Frontend components" $true
Test-Directory "C:\NM_final\server\src" "Backend src folder" $true
Write-Host ""

# ============================================
# Check That Build/Dependency Folders Are Gone
# ============================================
Write-Host "🗑️  Verifying Cleanup (should NOT exist):" -ForegroundColor Yellow
Test-Directory "C:\NM_final\client\node_modules" "Client node_modules" $false
Test-Directory "C:\NM_final\server\node_modules" "Server node_modules" $false
Test-Directory "C:\NM_final\client\.next" "Client .next cache" $false
Write-Host ""

# ============================================
# Check Essential Files
# ============================================
Write-Host "📄 Essential Configuration Files:" -ForegroundColor Yellow
Test-FileExists "C:\NM_final\README.md" "README.md" $true
Test-FileExists "C:\NM_final\.gitignore" ".gitignore" $true
Test-FileExists "C:\NM_final\client\package.json" "Client package.json" $true
Test-FileExists "C:\NM_final\server\package.json" "Server package.json" $true
Test-FileExists "C:\NM_final\client\tsconfig.json" "Client tsconfig.json" $true
Test-FileExists "C:\NM_final\server\tsconfig.json" "Server tsconfig.json" $true
Test-FileExists "C:\NM_final\client\next.config.js" "Next.js config" $true
Test-FileExists "C:\NM_final\client\tailwind.config.ts" "Tailwind config" $true
Write-Host ""

# ============================================
# Check Environment Templates
# ============================================
Write-Host "🔐 Environment Configuration:" -ForegroundColor Yellow
Test-FileExists "C:\NM_final\client\.env.example" "Client .env.example" $false
Test-FileExists "C:\NM_final\server\.env.example" "Server .env.example" $true

# Check that actual .env is NOT in git (should exist locally but be gitignored)
if (Test-Path "C:\NM_final\server\.env") {
    Write-Host "   ℹ️  Server .env exists locally (good, but ensure it's in .gitignore)" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Count Files
# ============================================
Write-Host "📊 File Statistics:" -ForegroundColor Yellow
$sourceFiles = Get-ChildItem -Path "C:\NM_final" -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notmatch '\\node_modules\\' -and 
        $_.FullName -notmatch '\\.next\\' -and 
        $_.FullName -notmatch '\\dist\\' 
    }

$totalFiles = ($sourceFiles | Measure-Object).Count
Write-Host "   Total source files: $totalFiles" -ForegroundColor White

if ($totalFiles -le 150) {
    Write-Host "   Status: ✅ Excellent (<150 files)" -ForegroundColor Green
    $script:passed += "✅ File count optimal"
} elseif ($totalFiles -le 200) {
    Write-Host "   Status: ✅ Good (<200 files)" -ForegroundColor Green
    $script:passed += "✅ File count acceptable"
} else {
    Write-Host "   Status: ⚠️  Review needed (>200 files)" -ForegroundColor Yellow
    $script:warnings += "⚠️  File count high ($totalFiles files)"
}
Write-Host ""

# ============================================
# Check Dependencies Installed
# ============================================
Write-Host "📦 Dependencies Status:" -ForegroundColor Yellow
$clientDeps = Test-Path "C:\NM_final\client\node_modules"
$serverDeps = Test-Path "C:\NM_final\server\node_modules"

if ($clientDeps -and $serverDeps) {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    $script:passed += "✅ Dependencies ready"
} elseif (-not $clientDeps -and -not $serverDeps) {
    Write-Host "   ℹ️  Dependencies not installed (run cleanup script to install)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Partial installation detected" -ForegroundColor Yellow
    $script:warnings += "⚠️  Dependencies partially installed"
}
Write-Host ""

# ============================================
# Check for Common Issues
# ============================================
Write-Host "🔍 Common Issues Check:" -ForegroundColor Yellow

# Check for .env in git
$gitignoreContent = Get-Content "C:\NM_final\.gitignore" -ErrorAction SilentlyContinue
if ($gitignoreContent -match '\.env') {
    $script:passed += "✅ .env files properly gitignored"
    Write-Host "   ✅ .env files are gitignored" -ForegroundColor Green
} else {
    $script:warnings += "⚠️  .env might not be properly gitignored"
    Write-Host "   ⚠️  Verify .env is in .gitignore" -ForegroundColor Yellow
}

# Check for large files
$largeFiles = $sourceFiles | Where-Object { $_.Length -gt 10MB }
if ($largeFiles.Count -gt 0) {
    Write-Host "   ⚠️  Found $($largeFiles.Count) large file(s) (>10MB)" -ForegroundColor Yellow
    $script:warnings += "⚠️  Large files detected"
    foreach ($file in $largeFiles | Select-Object -First 3) {
        $sizeInMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "      - $($file.Name): $sizeInMB MB" -ForegroundColor Gray
    }
} else {
    $script:passed += "✅ No large files found"
    Write-Host "   ✅ No large files detected" -ForegroundColor Green
}
Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HEALTH CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Passed Checks: $($passed.Count)" -ForegroundColor Green
Write-Host "⚠️  Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "❌ Errors: $($errors.Count)" -ForegroundColor Red
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 PROJECT STATUS: EXCELLENT!" -ForegroundColor Green
    Write-Host "   Your project is clean and ready for development/deployment." -ForegroundColor Green
} elseif ($errors.Count -eq 0) {
    Write-Host "✅ PROJECT STATUS: GOOD" -ForegroundColor Green
    Write-Host "   Minor warnings detected, but project is functional." -ForegroundColor Yellow
} else {
    Write-Host "⚠️  PROJECT STATUS: NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "   Please address the errors below." -ForegroundColor Yellow
}
Write-Host ""

# Show details if there are issues
if ($warnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
