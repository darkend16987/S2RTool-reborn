@echo off
REM ================================================================
REM S2RTool - Stop Script
REM ================================================================

title S2RTool - Stopping...
color 0E

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Stop Containers
echo ================================================================
echo.

REM Use production config if available
if exist "docker-compose.production.yaml" (
    echo Stopping containers (production mode)...
    docker-compose -f docker-compose.production.yaml down
) else (
    echo Stopping containers (development mode)...
    docker-compose down
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Failed to stop containers
    pause
    exit /b 1
)

color 0A
echo.
echo [OK] S2RTool containers stopped successfully
echo.
timeout /t 3 /nobreak >nul
