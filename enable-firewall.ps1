# Run this script as Administrator to allow phone access
# Right-click and select "Run with PowerShell" as Administrator

Write-Host "🔥 Opening Windows Firewall ports for NoteMitra..." -ForegroundColor Cyan

# Remove existing rules if any
Remove-NetFirewallRule -DisplayName "NoteMitra Backend Port 5000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "NoteMitra Frontend Port 3000" -ErrorAction SilentlyContinue

# Create new rules
try {
    New-NetFirewallRule -DisplayName "NoteMitra Backend Port 5000" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 5000 `
        -Action Allow `
        -Profile Any
    
    Write-Host "✅ Port 5000 opened for backend" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to open port 5000. Run as Administrator!" -ForegroundColor Red
}

try {
    New-NetFirewallRule -DisplayName "NoteMitra Frontend Port 3000" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3000 `
        -Action Allow `
        -Profile Any
    
    Write-Host "✅ Port 3000 opened for frontend" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to open port 3000. Run as Administrator!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Done! You can now access NoteMitra from your phone:" -ForegroundColor Yellow
Write-Host "   http://192.168.245.192:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Make sure your phone is on the same WiFi network!" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close"
