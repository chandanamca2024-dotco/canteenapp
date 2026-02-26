# Safe Android Run Script - Waits for emulator to boot completely

Write-Host "Starting Android emulator check..." -ForegroundColor Cyan

# Check if adb is available
$adbPath = "adb"
try {
    $null = & $adbPath version 2>&1
} catch {
    Write-Host "ADB not found in PATH. Using SDK path..." -ForegroundColor Yellow
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
}

# Wait for device
Write-Host "Waiting for device to connect..." -ForegroundColor Yellow
& $adbPath wait-for-device

Write-Host "Device connected. Waiting for boot to complete..." -ForegroundColor Yellow

# Wait for boot completion
$maxAttempts = 60
$attempt = 0
$booted = $false

while ($attempt -lt $maxAttempts -and -not $booted) {
    $attempt++
    $bootStatus = & $adbPath shell getprop sys.boot_completed 2>$null
    
    if ($bootStatus -match "1") {
        $booted = $true
        Write-Host "Device fully booted!" -ForegroundColor Green
    } else {
        Write-Host "Waiting... ($attempt/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $booted) {
    Write-Host "Timeout waiting for device to boot. Please check emulator manually." -ForegroundColor Red
    exit 1
}

# Additional wait for system to stabilize
Write-Host "Waiting for system to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Run React Native
Write-Host "`nStarting React Native..." -ForegroundColor Green
npx react-native run-android

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBuild failed. Try running again." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nApp installed successfully!" -ForegroundColor Green
}
