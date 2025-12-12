@echo off
REM ================================================================
REM S2RTool - Status Check
REM ================================================================

title S2RTool - Status
color 0B

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - System Status
echo ================================================================
echo.

echo [Docker Info]
docker info 2>nul | findstr "Server Version:"
if %errorlevel% neq 0 (
    echo Docker is NOT running
) else (
    echo Docker is running
)
echo.

echo [Container Status]
if exist "docker-compose.production.yaml" (
    docker-compose -f docker-compose.production.yaml ps
) else (
    docker-compose ps
)
echo.

echo [Network Test]
echo Testing frontend (localhost:3001)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3001
echo.
echo Testing backend (localhost:5001)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5001/health
echo.

echo Press any key to exit...
pause >nul
