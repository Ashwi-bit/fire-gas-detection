@echo off

echo ========================================
echo   FIRE AND GAS DETECTION SYSTEM
echo ========================================

call megha_env\Scripts\activate

echo Starting Auto Prediction...
start "Auto Prediction" cmd /k "python -m backend.services.auto_prediction"

echo Starting Flask Backend...
start "Flask Backend" cmd /k "python -m backend.app"

echo ========================================
echo   PROJECT STARTED
echo ========================================

pause