@echo off
setlocal enabledelayedexpansion

REM ============================================
REM S2RTool - Docker Images Loader
REM Version: 1.0
REM ============================================

echo.
echo ============================================
echo  Loading S2RTool Docker Images
echo ============================================
echo.

REM Get installation directory from argument or use default
set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\S2RTool"

echo Installation Directory: %INSTALL_DIR%
echo.

REM Check if images directory exists
if not exist "%INSTALL_DIR%\images" (
    echo ERROR: Images directory not found: %INSTALL_DIR%\images
    exit /b 1
)

cd /d "%INSTALL_DIR%\images"

REM ============================================
REM Load Backend Image
REM ============================================

echo [1/4] Checking backend image archive...
if not exist "s2rtool-backend-4.0.tar.gz" (
    echo ERROR: Backend image archive not found
    exit /b 1
)
echo       Backend archive found (size: %~z1 bytes)

echo [2/4] Decompressing backend image...
REM Check if 7z is available
where 7z >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    7z x -y s2rtool-backend-4.0.tar.gz >nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to decompress backend image
        exit /b 1
    )
) else (
    REM Fallback to PowerShell if 7z not available
    powershell -Command "& { $stream = New-Object IO.FileStream 's2rtool-backend-4.0.tar.gz', 'Open'; $gzip = New-Object IO.Compression.GzipStream $stream, ([IO.Compression.CompressionMode]::Decompress); $output = [IO.File]::Create('s2rtool-backend-4.0.tar'); $gzip.CopyTo($output); $output.Close(); $gzip.Close(); $stream.Close() }"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to decompress backend image with PowerShell
        exit /b 1
    )
)
echo       Decompression successful

echo [3/4] Loading backend image into Docker...
docker load -i s2rtool-backend-4.0.tar
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to load backend image into Docker
    echo        Make sure Docker is running
    exit /b 1
)
echo       Backend image loaded successfully

echo [4/4] Cleaning up backend temporary files...
del /q s2rtool-backend-4.0.tar >nul 2>&1
echo       Cleanup complete

echo.
echo ============================================
REM Load Frontend Image
REM ============================================

echo [1/4] Checking frontend image archive...
if not exist "s2rtool-frontend-4.0.tar.gz" (
    echo ERROR: Frontend image archive not found
    exit /b 1
)
echo       Frontend archive found

echo [2/4] Decompressing frontend image...
where 7z >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    7z x -y s2rtool-frontend-4.0.tar.gz >nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to decompress frontend image
        exit /b 1
    )
) else (
    powershell -Command "& { $stream = New-Object IO.FileStream 's2rtool-frontend-4.0.tar.gz', 'Open'; $gzip = New-Object IO.Compression.GzipStream $stream, ([IO.Compression.CompressionMode]::Decompress); $output = [IO.File]::Create('s2rtool-frontend-4.0.tar'); $gzip.CopyTo($output); $output.Close(); $gzip.Close(); $stream.Close() }"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to decompress frontend image with PowerShell
        exit /b 1
    )
)
echo       Decompression successful

echo [3/4] Loading frontend image into Docker...
docker load -i s2rtool-frontend-4.0.tar
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to load frontend image into Docker
    echo        Make sure Docker is running
    exit /b 1
)
echo       Frontend image loaded successfully

echo [4/4] Cleaning up frontend temporary files...
del /q s2rtool-frontend-4.0.tar >nul 2>&1
echo       Cleanup complete

echo.
echo ============================================
REM Tag Images
REM ============================================

echo Tagging images as latest...
docker tag s2rtool-backend:4.0 s2rtool-backend:latest 2>nul
docker tag s2rtool-frontend:4.0 s2rtool-frontend:latest 2>nul
echo Tags created successfully

echo.
echo ============================================
REM Verify Images
REM ============================================

echo Verifying loaded images...
docker images | findstr "s2rtool" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Loaded images:
    docker images | findstr "REPOSITORY\|s2rtool"
    echo.
    echo ============================================
    echo  All images loaded successfully!
    echo ============================================
    echo.
    exit /b 0
) else (
    echo ERROR: Images verification failed
    exit /b 1
)

endlocal
