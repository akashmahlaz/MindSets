@echo off
REM Windows batch script for testing Stream Chat features
echo 🎯 Stream Chat Feature Test Suite (Windows)
echo ===============================================
echo.
echo Running comprehensive chat feature tests...
echo.

cd /d "%~dp0.."
npm test

echo.
echo ℹ️  To run other commands on Windows:
echo    npm start      - Start development server
echo    npm run android - Test on Android
echo    npm run ios     - Test on iOS
echo.
pause
