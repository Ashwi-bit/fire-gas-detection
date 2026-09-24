@echo off
title Fire & Gas Detection System - Mobile
color 0A

echo ========================================
echo FIRE & GAS DETECTION SYSTEM - MOBILE
echo ========================================
echo.

set "PROJECT_ROOT=C:\Users\HP\OneDrive\Desktop\MegaProject"

echo [1/2] Starting Flask Backend...
start "Flask Backend" cmd /k "cd /d %PROJECT_ROOT% && call megha_env\Scripts\activate && python -m backend.app"

timeout /t 4 /nobreak >nul

echo [2/2] Starting Web Server for Phone...
start "Web Server" cmd /k "cd /d %PROJECT_ROOT%\frontend_megha\dist && python -m http.server 8000 --bind 0.0.0.0"

timeout /t 3 /nobreak >nul

:: Get current IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "LOCAL_IP=%%a"
    goto :found
)
:found
set LOCAL_IP=%LOCAL_IP:~1%

echo.
echo ========================================
echo DEMO IS RUNNING!
echo ========================================
echo.
echo On your phone browser, open:
echo   http://%LOCAL_IP%:8000
echo.
echo Make sure phone is on SAME WiFi as laptop!
echo.
echo Close the terminal windows to stop.
echo.
pause