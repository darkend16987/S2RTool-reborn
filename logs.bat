@echo off
REM ================================================================
REM S2RTool - View Logs
REM ================================================================

title S2RTool - Logs
color 0B

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Container Logs
echo ================================================================
echo.
echo Press Ctrl+C to exit log view
echo.
timeout /t 2 /nobreak >nul

REM Use production config if available
if exist "docker-compose.production.yaml" (
    docker-compose -f docker-compose.production.yaml logs -f
) else (
    docker-compose logs -f
)
