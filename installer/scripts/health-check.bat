@echo off
setlocal enabledelayedexpansion

REM ============================================
REM S2RTool - Health Check Script
REM Version: 1.0
REM ============================================

REM Get installation directory from argument or use default
set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\S2RTool"

REM Parse ports from .env file
set "FRONTEND_PORT=3001"
set "BACKEND_PORT=5001"

if exist "%INSTALL_DIR%\.env" (
    for /f "tokens=1,2 delims==" %%a in ('type "%INSTALL_DIR%\.env" ^| findstr /v "^#"') do (
        if "%%a"=="FRONTEND_PORT" set "FRONTEND_PORT=%%b"
        if "%%a"=="BACKEND_PORT" set "BACKEND_PORT=%%b"
    )
)

set /a "CHECKS_PASSED=0"
set /a "CHECKS_FAILED=0"
set /a "CHECKS_WARNING=0"

echo.
echo ============================================
echo  S2RTool Health Check
echo ============================================
echo.
echo Installation: %INSTALL_DIR%
echo Frontend Port: %FRONTEND_PORT%
echo Backend Port: %BACKEND_PORT%
echo.
echo ============================================

REM ============================================
REM Check 1: Docker Service
REM ============================================
echo.
echo [1/7] Checking Docker service...
docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       ✓ Docker is running
    set /a "CHECKS_PASSED+=1"
) else (
    echo       ✗ Docker is not running or not accessible
    set /a "CHECKS_FAILED+=1"
)

REM ============================================
REM Check 2: S2RTool Windows Service
REM ============================================
echo.
echo [2/7] Checking S2RTool Windows Service...
sc query S2RTool >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    sc query S2RTool | findstr "RUNNING" >nul
    if !ERRORLEVEL! EQU 0 (
        echo       ✓ Service is installed and running
        set /a "CHECKS_PASSED+=1"
    ) else (
        echo       ⚠ Service is installed but not running
        set /a "CHECKS_WARNING+=1"
    )
) else (
    echo       ⚠ Service is not installed (manual start may be in use)
    set /a "CHECKS_WARNING+=1"
)

REM ============================================
REM Check 3: Backend Container
REM ============================================
echo.
echo [3/7] Checking backend container...
docker ps --filter "name=s2rtool.*backend" --format "{{.Names}}" | findstr "backend" >nul
if %ERRORLEVEL% EQU 0 (
    echo       ✓ Backend container is running
    set /a "CHECKS_PASSED+=1"
) else (
    echo       ✗ Backend container is not running
    set /a "CHECKS_FAILED+=1"
)

REM ============================================
REM Check 4: Frontend Container
REM ============================================
echo.
echo [4/7] Checking frontend container...
docker ps --filter "name=s2rtool.*frontend" --format "{{.Names}}" | findstr "frontend" >nul
if %ERRORLEVEL% EQU 0 (
    echo       ✓ Frontend container is running
    set /a "CHECKS_PASSED+=1"
) else (
    echo       ✗ Frontend container is not running
    set /a "CHECKS_FAILED+=1"
)

REM ============================================
REM Check 5: Backend Health Endpoint
REM ============================================
echo.
echo [5/7] Checking backend health endpoint...
REM Use curl if available, otherwise use PowerShell
where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    curl -s -o nul -w "%%{http_code}" http://localhost:%BACKEND_PORT%/health | findstr "200" >nul
    if !ERRORLEVEL! EQU 0 (
        echo       ✓ Backend is responding (HTTP 200)
        set /a "CHECKS_PASSED+=1"
    ) else (
        echo       ✗ Backend is not responding correctly
        set /a "CHECKS_FAILED+=1"
    )
) else (
    REM Fallback to PowerShell
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/health' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo       ✓ Backend is responding (HTTP 200)
        set /a "CHECKS_PASSED+=1"
    ) else (
        echo       ✗ Backend is not responding correctly
        set /a "CHECKS_FAILED+=1"
    )
)

REM ============================================
REM Check 6: Frontend Accessibility
REM ============================================
echo.
echo [6/7] Checking frontend accessibility...
where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    curl -s -o nul -w "%%{http_code}" http://localhost:%FRONTEND_PORT% | findstr "200" >nul
    if !ERRORLEVEL! EQU 0 (
        echo       ✓ Frontend is accessible (HTTP 200)
        set /a "CHECKS_PASSED+=1"
    ) else (
        echo       ✗ Frontend is not accessible
        set /a "CHECKS_FAILED+=1"
    )
) else (
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%FRONTEND_PORT%' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo       ✓ Frontend is accessible (HTTP 200)
        set /a "CHECKS_PASSED+=1"
    ) else (
        echo       ✗ Frontend is not accessible
        set /a "CHECKS_FAILED+=1"
    )
)

REM ============================================
REM Check 7: Configuration File
REM ============================================
echo.
echo [7/7] Checking configuration...
if exist "%INSTALL_DIR%\.env" (
    findstr /c:"GEMINI_API_KEY=" "%INSTALL_DIR%\.env" >nul
    if !ERRORLEVEL! EQU 0 (
        REM Check if API key is not empty
        for /f "tokens=2 delims==" %%a in ('findstr /c:"GEMINI_API_KEY=" "%INSTALL_DIR%\.env"') do (
            if not "%%a"=="" if not "%%a"=="your_gemini_api_key_here" (
                echo       ✓ Configuration file exists with API key
                set /a "CHECKS_PASSED+=1"
            ) else (
                echo       ⚠ Configuration file exists but API key not set
                set /a "CHECKS_WARNING+=1"
            )
        )
    ) else (
        echo       ⚠ Configuration file exists but API key missing
        set /a "CHECKS_WARNING+=1"
    )
) else (
    echo       ✗ Configuration file (.env) not found
    set /a "CHECKS_FAILED+=1"
)

REM ============================================
REM Summary
REM ============================================
echo.
echo ============================================
echo  Health Check Summary
echo ============================================
echo.
echo Passed:   %CHECKS_PASSED%
echo Warnings: %CHECKS_WARNING%
echo Failed:   %CHECKS_FAILED%
echo.

if %CHECKS_FAILED% EQU 0 (
    if %CHECKS_WARNING% EQU 0 (
        echo Status: ✓ ALL SYSTEMS OPERATIONAL
        echo.
        echo S2RTool is ready to use!
        echo Access at: http://localhost:%FRONTEND_PORT%
        echo.
        exit /b 0
    ) else (
        echo Status: ⚠ OPERATIONAL WITH WARNINGS
        echo.
        echo S2RTool is running but some components need attention.
        echo.
        exit /b 2
    )
) else (
    echo Status: ✗ CRITICAL ISSUES DETECTED
    echo.
    echo S2RTool is not fully operational.
    echo.
    echo Troubleshooting:
    echo   1. Check Docker is running: docker ps
    echo   2. Check logs: docker-compose -f "%INSTALL_DIR%\docker-compose.yaml" logs
    echo   3. Restart services: net stop S2RTool ^&^& net start S2RTool
    echo   4. Check configuration: type "%INSTALL_DIR%\.env"
    echo.
    exit /b 1
)

endlocal
