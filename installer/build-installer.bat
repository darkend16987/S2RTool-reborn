@echo off
setlocal enabledelayedexpansion

REM ============================================
REM S2RTool Standalone Installer Builder
REM Windows Build Script
REM ============================================

echo.
echo ============================================
echo  S2RTool Installer Builder v1.0
echo ============================================
echo.

REM Change to installer directory
cd /d "%~dp0"

REM ============================================
REM Check Prerequisites
REM ============================================

echo [1/9] Checking prerequisites...

REM Check if Inno Setup is installed
set "INNO_SETUP_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist "%INNO_SETUP_PATH%" (
    echo ERROR: Inno Setup 6 not found at: %INNO_SETUP_PATH%
    echo.
    echo Please install Inno Setup 6 from:
    echo https://jrsoftware.org/isdl.php
    echo.
    pause
    exit /b 1
)
echo       ✓ Inno Setup 6 found

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found in PATH
    echo.
    echo Please install Node.js 18.x or later from:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo       ✓ Node.js found

REM Check if Docker is available
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Docker not found in PATH
    echo          Docker is required to export images
    echo.
)

echo.
echo [2/9] Verifying project structure...

REM Check required files exist
if not exist "setup.iss" (
    echo ERROR: setup.iss not found
    exit /b 1
)
echo       ✓ Inno Setup script found

if not exist "..\docker-compose.yaml" (
    echo ERROR: docker-compose.yaml not found in parent directory
    exit /b 1
)
echo       ✓ Docker Compose configuration found

echo.
echo ============================================
echo  Building Electron Applications
echo ============================================

REM ============================================
REM Build Configuration Wizard
REM ============================================

echo.
echo [3/9] Building Configuration Wizard...

cd config-wizard

if not exist "node_modules" (
    echo       Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed for config-wizard
        cd ..
        exit /b 1
    )
)

echo       Building executable...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build Configuration Wizard
    cd ..
    exit /b 1
)

echo       ✓ Configuration Wizard built successfully

cd ..

REM ============================================
REM Build System Tray App
REM ============================================

echo.
echo [4/9] Building System Tray Application...

cd tray-app

if not exist "node_modules" (
    echo       Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed for tray-app
        cd ..
        exit /b 1
    )
)

echo       Building executable...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build System Tray App
    cd ..
    exit /b 1
)

echo       ✓ System Tray App built successfully

cd ..

echo.
echo ============================================
echo  Downloading Dependencies
echo ============================================

REM ============================================
REM Download NSSM
REM ============================================

echo.
echo [5/9] Checking NSSM...

if not exist "bin\nssm.exe" (
    echo       NSSM not found, downloading...

    if not exist "bin" mkdir bin

    REM Download NSSM using PowerShell
    powershell -Command "& { Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'bin\nssm.zip' }"

    if %ERRORLEVEL% EQU 0 (
        echo       Extracting NSSM...
        powershell -Command "& { Expand-Archive -Path 'bin\nssm.zip' -DestinationPath 'bin' -Force }"

        REM Copy 64-bit version
        copy /y "bin\nssm-2.24\win64\nssm.exe" "bin\nssm.exe" >nul

        REM Clean up
        del /q "bin\nssm.zip" >nul 2>&1
        rd /s /q "bin\nssm-2.24" >nul 2>&1

        echo       ✓ NSSM downloaded and extracted
    ) else (
        echo ERROR: Failed to download NSSM
        echo        Please download manually from: https://nssm.cc/release/nssm-2.24.zip
        echo        Extract and place nssm.exe in: bin\nssm.exe
        pause
        exit /b 1
    )
) else (
    echo       ✓ NSSM already present
)

REM ============================================
REM Export Docker Images (Optional)
REM ============================================

echo.
echo [6/9] Checking Docker images...

if not exist "images" mkdir images

if exist "images\s2rtool-backend-4.0.tar.gz" (
    echo       ✓ Backend image already exported
) else (
    echo       Backend image not found
    where docker >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       Attempting to export backend image...
        cd ..
        docker save s2rtool-backend:latest -o installer\images\s2rtool-backend-4.0.tar
        if %ERRORLEVEL% EQU 0 (
            cd installer\images
            powershell -Command "& { Compress-Archive -Path 's2rtool-backend-4.0.tar' -DestinationPath 's2rtool-backend-4.0.tar.gz' -Force }"
            del /q s2rtool-backend-4.0.tar
            cd ..\..
            echo       ✓ Backend image exported
        ) else (
            cd installer
            echo       WARNING: Failed to export backend image
            echo                Build the image first: docker-compose build backend
        )
    ) else (
        echo       WARNING: Docker not available, image export skipped
    )
)

if exist "images\s2rtool-frontend-4.0.tar.gz" (
    echo       ✓ Frontend image already exported
) else (
    echo       Frontend image not found
    where docker >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       Attempting to export frontend image...
        cd ..
        docker save s2rtool-frontend:latest -o installer\images\s2rtool-frontend-4.0.tar
        if %ERRORLEVEL% EQU 0 (
            cd installer\images
            powershell -Command "& { Compress-Archive -Path 's2rtool-frontend-4.0.tar' -DestinationPath 's2rtool-frontend-4.0.tar.gz' -Force }"
            del /q s2rtool-frontend-4.0.tar
            cd ..\..
            echo       ✓ Frontend image exported
        ) else (
            cd installer
            echo       WARNING: Failed to export frontend image
            echo                Build the image first: docker-compose build frontend
        )
    ) else (
        echo       WARNING: Docker not available, image export skipped
    )
)

REM ============================================
REM Download Rancher Desktop (Info Only)
REM ============================================

echo.
echo [7/9] Checking Rancher Desktop installer...

if exist "bin\RancherDesktop-Setup.exe" (
    echo       ✓ Rancher Desktop installer found
) else (
    echo       ⚠ Rancher Desktop installer NOT found
    echo.
    echo       For a complete installer, download Rancher Desktop:
    echo       https://github.com/rancher-sandbox/rancher-desktop/releases/latest
    echo.
    echo       Download: Rancher Desktop Setup X.X.X.exe
    echo       Save to:  installer\bin\RancherDesktop-Setup.exe
    echo.
    echo       Press any key to continue without Rancher Desktop...
    echo       (You can add it later)
    echo.
    pause >nul
)

REM ============================================
REM Compile Installer
REM ============================================

echo.
echo [8/9] Compiling installer with Inno Setup...
echo.

"%INNO_SETUP_PATH%" setup.iss

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Inno Setup compilation failed
    echo.
    pause
    exit /b 1
)

echo.
echo       ✓ Installer compiled successfully!

REM ============================================
REM Summary
REM ============================================

echo.
echo [9/9] Build complete!
echo.

if exist "Output\S2RTool-Installer-v4.0.exe" (
    for %%A in ("Output\S2RTool-Installer-v4.0.exe") do set "FILESIZE=%%~zA"
    set /a "FILESIZE_MB=!FILESIZE! / 1048576"

    echo ============================================
    echo  Build Summary
    echo ============================================
    echo.
    echo Output file: Output\S2RTool-Installer-v4.0.exe
    echo File size:   !FILESIZE_MB! MB
    echo.
    echo Components included:
    echo   ✓ Configuration Wizard
    echo   ✓ System Tray Application
    echo   ✓ NSSM Service Manager
    echo   ✓ Helper Scripts
    echo   ✓ Docker Compose configs

    if exist "images\s2rtool-backend-4.0.tar.gz" (
        echo   ✓ Backend Docker image
    ) else (
        echo   ✗ Backend Docker image
    )

    if exist "images\s2rtool-frontend-4.0.tar.gz" (
        echo   ✓ Frontend Docker image
    ) else (
        echo   ✗ Frontend Docker image
    )

    if exist "bin\RancherDesktop-Setup.exe" (
        echo   ✓ Rancher Desktop installer
    ) else (
        echo   ✗ Rancher Desktop installer
    )

    echo.
    echo ============================================
    echo.
    echo The installer is ready for distribution!
    echo.
) else (
    echo ERROR: Output file not found
    echo        Check the compilation output above for errors
    echo.
)

pause
endlocal
