@echo off
setlocal enabledelayedexpansion

REM ============================================
REM S2RTool - Windows Service Installer
REM Version: 1.0
REM ============================================

echo.
echo ============================================
echo  S2RTool Windows Service Installation
echo ============================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires Administrator privileges
    echo        Please run as Administrator
    pause
    exit /b 1
)

REM Get installation directory from argument or use default
set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\S2RTool"

echo Installation Directory: %INSTALL_DIR%
echo.

REM Verify installation directory exists
if not exist "%INSTALL_DIR%" (
    echo ERROR: Installation directory not found: %INSTALL_DIR%
    exit /b 1
)

REM Verify docker-compose.yaml exists
if not exist "%INSTALL_DIR%\docker-compose.yaml" (
    echo ERROR: docker-compose.yaml not found in installation directory
    exit /b 1
)

REM Verify NSSM exists
if not exist "%INSTALL_DIR%\bin\nssm.exe" (
    echo ERROR: NSSM not found in %INSTALL_DIR%\bin\
    exit /b 1
)

echo [1/7] Locating docker-compose executable...
REM Find docker-compose executable
where docker-compose >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: docker-compose not found in PATH
    echo        Make sure Rancher Desktop is installed and running
    exit /b 1
)

for /f "delims=" %%i in ('where docker-compose') do set "DOCKER_COMPOSE_PATH=%%i"
echo       Found: %DOCKER_COMPOSE_PATH%

echo.
echo [2/7] Checking if service already exists...
sc query S2RTool >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       Service already exists, stopping...
    net stop S2RTool >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo       Removing existing service...
    "%INSTALL_DIR%\bin\nssm.exe" remove S2RTool confirm >nul 2>&1
    timeout /t 1 /nobreak >nul
)
echo       Ready to install service

echo.
echo [3/7] Installing Windows Service...
"%INSTALL_DIR%\bin\nssm.exe" install S2RTool "%DOCKER_COMPOSE_PATH%" -f "%INSTALL_DIR%\docker-compose.yaml" up
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install service
    exit /b 1
)
echo       Service installed successfully

echo.
echo [4/7] Configuring service parameters...

REM Set working directory
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppDirectory "%INSTALL_DIR%" >nul
echo       - Working directory: %INSTALL_DIR%

REM Set display name and description
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool DisplayName "S2RTool Rendering Service" >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool Description "S2RTool AI-powered architectural rendering service powered by Google Gemini" >nul
echo       - Display name and description set

REM Set startup type to automatic
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool Start SERVICE_AUTO_START >nul
echo       - Startup type: Automatic

REM Set stop method (give 10 seconds for graceful shutdown)
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStopMethodConsole 10000 >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStopMethodWindow 10000 >nul
echo       - Graceful shutdown timeout: 10 seconds

REM Set restart policy
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppExit Default Restart >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRestartDelay 5000 >nul
echo       - Restart on failure: Enabled (5 second delay)

REM Create logs directory if not exists
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

REM Set logging
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStdout "%INSTALL_DIR%\logs\service-stdout.log" >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStderr "%INSTALL_DIR%\logs\service-stderr.log" >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRotateFiles 1 >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRotateOnline 1 >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRotateSeconds 86400 >nul
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRotateBytes 10485760 >nul
echo       - Logging configured (rotating daily, max 10MB)

echo.
echo [5/7] Setting environment variables...
REM Load environment from .env file if it exists
if exist "%INSTALL_DIR%\.env" (
    echo       - Loading .env file configuration
    "%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppEnvironmentExtra :"%INSTALL_DIR%\.env" >nul
    echo       - Environment variables loaded from .env
) else (
    echo       - WARNING: .env file not found, service may not start correctly
)

echo.
echo [6/7] Setting service dependencies...
REM Ensure docker service is started before S2RTool
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool DependOnService "Rancher Desktop" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       - Dependency: Rancher Desktop service
) else (
    echo       - Note: Rancher Desktop service not found (this is OK if using different Docker)
)

echo.
echo [7/7] Starting service...
net start S2RTool
if %ERRORLEVEL% EQU 0 (
    echo       Service started successfully

    REM Wait a few seconds for containers to start
    echo.
    echo Waiting for containers to initialize...
    timeout /t 5 /nobreak >nul

    REM Check container status
    docker-compose -f "%INSTALL_DIR%\docker-compose.yaml" ps

    echo.
    echo ============================================
    echo  Service installation completed successfully!
    echo ============================================
    echo.
    echo Service Name: S2RTool
    echo Status: Running
    echo Startup Type: Automatic
    echo.
    echo Logs location: %INSTALL_DIR%\logs\
    echo.
    echo To manage the service:
    echo   - Start:   net start S2RTool
    echo   - Stop:    net stop S2RTool
    echo   - Restart: net stop S2RTool ^&^& net start S2RTool
    echo   - Status:  sc query S2RTool
    echo.
    exit /b 0
) else (
    echo ERROR: Failed to start service
    echo.
    echo Troubleshooting:
    echo   1. Check if Docker is running: docker ps
    echo   2. Check service logs: type "%INSTALL_DIR%\logs\service-stderr.log"
    echo   3. Verify .env file exists: dir "%INSTALL_DIR%\.env"
    echo   4. Try starting manually: cd "%INSTALL_DIR%" ^&^& docker-compose up
    echo.
    exit /b 1
)

endlocal
