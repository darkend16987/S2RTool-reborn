@echo off
REM ================================================================
REM S2RTool - Quick Start Script
REM ================================================================
REM This script will:
REM   1. Start Docker Desktop if not running
REM   2. Start S2RTool containers
REM   3. Open browser to localhost:3001
REM ================================================================

title S2RTool - Starting...
color 0B

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Quick Start
echo ================================================================
echo.

REM ================================================================
REM Check if Docker is installed
REM ================================================================
where docker >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker is not installed!
    echo Please run install-windows.bat first.
    echo.
    pause
    exit /b 1
)

REM ================================================================
REM Check if Docker is running, start if needed
REM ================================================================
echo [1/3] Checking Docker Desktop...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker Desktop is not running. Starting...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    echo Waiting for Docker Desktop to start...
    set /a counter=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>nul
    if %errorlevel% equ 0 goto docker_ready

    set /a counter+=1
    if %counter% geq 12 (
        color 0C
        echo [ERROR] Docker failed to start. Please start Docker Desktop manually.
        pause
        exit /b 1
    )
    goto wait_docker

    :docker_ready
    echo [OK] Docker Desktop is running
) else (
    echo [OK] Docker Desktop is running
)
echo.

REM ================================================================
REM Start containers
REM ================================================================
echo [2/3] Starting S2RTool containers...

REM Use production config if available, otherwise development
if exist "docker-compose.production.yaml" (
    docker-compose -f docker-compose.production.yaml up -d
) else (
    docker-compose up -d
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Failed to start containers!
    echo Try running: install-windows.bat
    pause
    exit /b 1
)

echo [OK] Containers started
echo.

REM ================================================================
REM Wait for frontend and open browser
REM ================================================================
echo [3/3] Waiting for application to be ready...

set /a counter=0
:wait_app
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001 >nul 2>nul
if %errorlevel% equ 0 goto app_ready

set /a counter+=1
if %counter% geq 20 (
    echo [WARNING] Application is taking longer than expected...
    goto open_anyway
)
goto wait_app

:app_ready
echo [OK] Application is ready!
echo.

:open_anyway
REM Open browser
echo Opening http://localhost:3001 in your browser...
start http://localhost:3001

color 0A
echo.
echo ================================================================
echo   S2RTool is running!
echo ================================================================
echo.
echo Application URL: http://localhost:3001
echo.
echo To stop: run stop.bat or press Ctrl+C and run "docker-compose down"
echo To view logs: run logs.bat
echo.
echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul
