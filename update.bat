@echo off
REM ================================================================
REM S2RTool - Update Script
REM ================================================================
REM This will pull latest images and restart containers.
REM NOTE: Watchtower normally handles this automatically every 5 min.
REM       Use this script only for immediate manual updates.
REM ================================================================

title S2RTool - Update
color 0B

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Manual Update
echo ================================================================
echo.

REM Check if Watchtower is running
docker ps --filter "name=s2rtool-watchtower" --format "{{.Names}}" 2>nul | findstr /i "watchtower" >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Watchtower is running - auto-updates are active.
    echo [INFO] This script is for MANUAL updates only.
    echo.
)

echo This will:
echo   1. Pull latest images from Docker Hub
echo   2. Restart containers with new images
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
echo [2/3] Pulling latest images from Docker Hub...
if exist "docker-compose.production.yaml" (
    docker-compose -f docker-compose.production.yaml pull
) else if exist "docker-compose.client.yaml" (
    docker-compose -f docker-compose.client.yaml pull
) else (
    docker-compose pull
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Failed to pull images! Check your internet connection.
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
echo Watchtower will continue to auto-update in the background.
echo.
pause

