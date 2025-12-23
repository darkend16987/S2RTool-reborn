@echo off
setlocal enabledelayedexpansion

REM ============================================
REM S2RTool - Windows Service Uninstaller
REM Version: 1.0
REM ============================================

echo.
echo ============================================
echo  S2RTool Windows Service Uninstallation
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

REM Check if service exists
sc query S2RTool >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Service 'S2RTool' is not installed
    echo Nothing to uninstall
    exit /b 0
)

echo [1/4] Checking service status...
sc query S2RTool | findstr "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo       Service is running
    echo.
    echo [2/4] Stopping service...
    net stop S2RTool
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Failed to stop service gracefully
        echo          Attempting force stop...
        sc stop S2RTool >nul 2>&1
    )
    timeout /t 3 /nobreak >nul
    echo       Service stopped
) else (
    echo       Service is not running
    echo.
    echo [2/4] Skipping stop (service not running)
)

echo.
echo [3/4] Stopping Docker containers...
if exist "%INSTALL_DIR%\docker-compose.yaml" (
    pushd "%INSTALL_DIR%"
    docker-compose down >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       Containers stopped successfully
    ) else (
        echo       No containers to stop or docker-compose not available
    )
    popd
) else (
    echo       docker-compose.yaml not found, skipping container cleanup
)

echo.
echo [4/4] Removing service...
if exist "%INSTALL_DIR%\bin\nssm.exe" (
    "%INSTALL_DIR%\bin\nssm.exe" remove S2RTool confirm
    if %ERRORLEVEL% EQU 0 (
        echo       Service removed successfully
    ) else (
        echo ERROR: Failed to remove service with NSSM
        echo       Attempting removal with sc command...
        sc delete S2RTool
    )
) else (
    echo       NSSM not found, using sc command...
    sc delete S2RTool
)

REM Verify service is removed
timeout /t 2 /nobreak >nul
sc query S2RTool >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo  Service uninstalled successfully!
    echo ============================================
    echo.
    exit /b 0
) else (
    echo.
    echo ERROR: Service still exists after removal
    echo        You may need to reboot and try again
    echo.
    exit /b 1
)

endlocal
