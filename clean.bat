@echo off
REM ================================================================
REM S2RTool - Clean Up Script
REM ================================================================
REM WARNING: This will remove containers, networks, and optionally volumes
REM ================================================================

title S2RTool - Clean Up
color 0E

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Clean Up
echo ================================================================
echo.
echo WARNING: This will stop and remove all S2RTool containers.
echo.
echo Do you want to also remove volumes (reference images)?
choice /C YN /M "Remove volumes"
set remove_volumes=%errorlevel%

echo.
echo This action cannot be undone. Continue?
choice /C YN /M "Confirm cleanup"
if %errorlevel% neq 1 (
    echo Cleanup cancelled.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo.
echo Cleaning up...

if exist "docker-compose.production.yaml" (
    if %remove_volumes% equ 1 (
        docker-compose -f docker-compose.production.yaml down -v
    ) else (
        docker-compose -f docker-compose.production.yaml down
    )
) else (
    if %remove_volumes% equ 1 (
        docker-compose down -v
    ) else (
        docker-compose down
    )
)

echo.
echo [OK] Cleanup complete
echo.
timeout /t 3 /nobreak >nul
