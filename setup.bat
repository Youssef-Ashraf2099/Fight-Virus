@echo off
echo ==========================================
echo   Virus Hunter - Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [31mNode.js is not installed![0m
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [32mNode.js detected[0m
node --version
echo.

REM Install dependencies
echo [36mInstalling dependencies...[0m
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [31mFailed to install dependencies[0m
    pause
    exit /b 1
)

echo [32mDependencies installed successfully![0m
echo.

REM Download Three.js
echo [36mDownloading Three.js library...[0m
if not exist "src\lib" mkdir src\lib

curl -o src\lib\three.module.js https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js

if %ERRORLEVEL% NEQ 0 (
    echo [33mFailed to download Three.js automatically[0m
    echo Please download manually from:
    echo https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
    echo And save it to: src\lib\three.module.js
) else (
    echo [32mThree.js downloaded successfully![0m
)

echo.
echo ==========================================
echo   Setup Complete! [32m[0m
echo ==========================================
echo.
echo To start the game:
echo   npm run dev     # Development mode (with DevTools)
echo   npm start       # Production mode
echo.
echo To build executables:
echo   npm run build:win    # Windows
echo   npm run build:mac    # macOS
echo   npm run build:linux  # Linux
echo.
echo Happy virus hunting! [32m[0m
echo.
pause
