@echo off
REM ================================================================
REM S2RTool - Windows Installation Script
REM ================================================================
REM This script will:
REM   1. Check Docker Desktop installation
REM   2. Check and update WSL
REM   3. Create .env file if needed
REM   4. Build and start containers
REM   5. Open browser to localhost:3001
REM ================================================================

title S2RTool - Installation
color 0A
echo.
echo ================================================================
echo   S2RTool - Sketch to Render Tool
echo   Windows Installation Script
echo ================================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM ================================================================
REM STEP 1: Check Docker Desktop
REM ================================================================
echo [1/6] Checking Docker Desktop...
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker Desktop is not installed!
    echo.
    echo Please install Docker Desktop first:
    echo   1. Download from: https://www.docker.com/products/docker-desktop/
    echo   2. Run installer
    echo   3. Restart your computer
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM ================================================================
REM STEP 2: Check if Docker is running
REM ================================================================
echo [2/6] Checking if Docker is running...
echo.

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker Desktop is not running
    echo Attempting to start Docker Desktop...
    echo.

    REM Try to start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    echo Waiting for Docker Desktop to start (this may take 30-60 seconds)...
    timeout /t 10 /nobreak >nul

    REM Wait for Docker to be ready (max 60 seconds)
    set /a counter=0
    :wait_docker
    docker info >nul 2>nul
    if %errorlevel% equ 0 goto docker_ready

    set /a counter+=1
    if %counter% geq 12 (
        color 0C
        echo [ERROR] Docker Desktop failed to start within 60 seconds
        echo.
        echo Please:
        echo   1. Manually start Docker Desktop
        echo   2. Wait for it to be ready
        echo   3. Run this script again
        echo.
        pause
        exit /b 1
    )

    timeout /t 5 /nobreak >nul
    goto wait_docker

    :docker_ready
    echo [OK] Docker Desktop is now running
) else (
    echo [OK] Docker Desktop is running
)
echo.

REM ================================================================
REM STEP 3: Check and Update WSL
REM ================================================================
echo [3/6] Checking WSL (Windows Subsystem for Linux)...
echo.

wsl --status >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] WSL is not installed or not configured properly
    echo.
    echo Do you want to update WSL now? (This may require admin privileges)
    choice /C YN /M "Update WSL"
    if %errorlevel% equ 1 (
        echo Updating WSL...
        wsl --update
        if %errorlevel% neq 0 (
            echo [WARNING] WSL update failed or requires restart
            echo If Docker doesn't work, please:
            echo   1. Open PowerShell as Administrator
            echo   2. Run: wsl --update
            echo   3. Restart your computer
            echo.
            pause
        ) else (
            echo [OK] WSL updated successfully
        )
    )
) else (
    echo [OK] WSL is installed
    echo.
    echo Do you want to update WSL to the latest version?
    choice /C YN /M "Update WSL"
    if %errorlevel% equ 1 (
        echo Updating WSL...
        wsl --update
        echo [OK] WSL update completed
    )
)
echo.

REM ================================================================
REM STEP 4: Create .env file
REM ================================================================
echo [4/6] Checking environment configuration...
echo.

if not exist ".env" (
    echo [INFO] .env file not found, creating from template...

    if exist ".env.production.template" (
        copy ".env.production.template" ".env" >nul
        echo [OK] .env file created
        echo.
        color 0E
        echo ================================================================
        echo   IMPORTANT: Configure your API key!
        echo ================================================================
        echo.
        echo Please edit .env file and add your GEMINI_API_KEY:
        echo   1. Get your API key from: https://makersuite.google.com/app/apikey
        echo   2. Open .env file in a text editor
        echo   3. Replace 'your_gemini_api_key_here' with your actual key
        echo   4. Save the file
        echo.
        echo Do you want to edit .env now?
        choice /C YN /M "Edit .env file"
        if %errorlevel% equ 1 (
            notepad .env
        )
        echo.
        echo Press any key when you have configured your API key...
        pause >nul
        color 0A
    ) else (
        color 0C
        echo [ERROR] .env.production.template not found!
        echo Please make sure you have the complete S2RTool package.
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file exists
)
echo.

REM ================================================================
REM STEP 5: Build and Start Containers
REM ================================================================
echo [5/6] Building and starting S2RTool containers...
echo.
echo This may take several minutes on first run...
echo.

REM Check which docker-compose file to use
if exist "docker-compose.production.yaml" (
    echo Using production configuration...
    docker-compose -f docker-compose.production.yaml up -d --build
) else if exist "docker-compose.yaml" (
    echo Using development configuration...
    docker-compose up -d --build
) else (
    color 0C
    echo [ERROR] No docker-compose.yaml file found!
    pause
    exit /b 1
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Failed to start containers!
    echo.
    echo Common issues:
    echo   - Port 3001 or 5001 already in use
    echo   - GEMINI_API_KEY not set in .env
    echo   - Docker out of memory
    echo.
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo [OK] Containers started successfully
echo.

REM ================================================================
REM STEP 6: Wait for services and open browser
REM ================================================================
echo [6/6] Waiting for services to be ready...
echo.

REM Wait for frontend to be accessible
set /a counter=0
:wait_frontend
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001 >nul 2>nul
if %errorlevel% equ 0 goto frontend_ready

set /a counter+=1
if %counter% geq 30 (
    color 0E
    echo [WARNING] Frontend is taking longer than expected to start
    echo Check logs with: docker-compose logs -f frontend
    goto show_info
)

echo Waiting for frontend... (%counter%/30)
goto wait_frontend

:frontend_ready
echo [OK] Frontend is ready!
echo.

REM Open browser
echo Opening browser to http://localhost:3001...
start http://localhost:3001
echo.

:show_info
color 0A
echo ================================================================
echo   S2RTool Installation Complete!
echo ================================================================
echo.
echo Application is running at: http://localhost:3001
echo.
echo Useful commands:
echo   start.bat     - Start the application (quick launch)
echo   stop.bat      - Stop the application
echo   restart.bat   - Restart the application
echo   logs.bat      - View application logs
echo.
echo Container status:
docker-compose ps
echo.
echo Press any key to exit...
pause >nul
