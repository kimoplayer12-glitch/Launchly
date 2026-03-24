@echo off
setlocal enabledelayedexpansion

REM Simple batch script to test the API
timeout /t 2 /nobreak

echo Testing API endpoint...

REM Using PowerShell to make the request
powershell -Command ^
    "try { " ^
    "$body = '{\"displayName\": \"karim moh\", \"amount\": 500}'; " ^
    "$headers = @{'x-admin-key' = 'launchforge-admin-secret-2024'}; " ^
    "$response = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/add-credits' -Method Post -Headers $headers -Body $body -ContentType 'application/json'; " ^
    "Write-Host ($response | ConvertTo-Json -Depth 10) " ^
    "} catch { Write-Host 'Error: ' $_  }"

echo Done.
