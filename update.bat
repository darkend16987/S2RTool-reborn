@echo off
REM ================================================================
REM S2RTool - Update Script
REM ================================================================
REM This will pull latest images and rebuild containers
REM ================================================================

title S2RTool - Update
color 0B

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Update and Rebuild
echo ================================================================
echo.

echo This will:
echo   1. Pull latest images from registry (if configured)
echo   2. Rebuild containers
echo   3. Restart the application
echo.
echo Continue?
choice /C YN /M "Confirm update"
if %errorlevel% neq 1 (
    echo Update cancelled.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo.
echo [1/3] Stopping current containers...
call stop.bat

echo.
echo [2/3] Pulling latest images and rebuilding...
if exist "docker-compose.production.yaml" (
    docker-compose -f docker-compose.production.yaml pull
    docker-compose -f docker-compose.production.yaml build --no-cache
) else (
    docker-compose pull
    docker-compose build --no-cache
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Update failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Starting updated containers...
call start.bat

color 0A
echo.
echo [OK] Update complete!
echo.
pause
