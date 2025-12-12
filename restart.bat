@echo off
REM ================================================================
REM S2RTool - Restart Script
REM ================================================================

title S2RTool - Restarting...
color 0E

cd /d "%~dp0"

echo.
echo ================================================================
echo   S2RTool - Restart Containers
echo ================================================================
echo.

echo Stopping containers...
call stop.bat

echo.
echo Starting containers...
call start.bat
