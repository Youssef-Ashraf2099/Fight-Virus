@echo off
REM Tauri Setup Script for Virus Hunter
REM This script installs all necessary dependencies and builds the game

echo.
echo ========================================
echo   Virus Hunter - Tauri Migration Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js...
node --version
echo OK!
echo.

REM Check if Rust is installed
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Rust is not installed!
    echo.
    echo Would you like to install Rust now? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo Downloading Rust installer...
        powershell -Command "irm https://sh.rustup.rs | iex"
        if %errorlevel% neq 0 (
            echo ERROR: Failed to install Rust!
            pause
            exit /b 1
        )
        echo Please close and reopen this terminal after Rust installs.
        pause
        exit /b 0
    )
) else (
    echo [2/4] Checking Rust...
    rustc --version
    echo OK!
)
echo.

REM Install npm dependencies
echo [3/4] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo OK!
echo.

REM Verify Tauri CLI
echo [4/4] Verifying Tauri...
call npx tauri --version
echo OK!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Run the game: npm run dev
echo   2. Build: npm run build:win
echo   3. Read docs: TAURI_MIGRATION.md
echo.
pause
