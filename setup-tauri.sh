#!/bin/bash

# Tauri Setup Script for Virus Hunter
# This script installs all necessary dependencies and builds the game

echo ""
echo "========================================"
echo "  Virus Hunter - Tauri Migration Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Checking Node.js..."
node --version
echo "OK!"
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "WARNING: Rust is not installed!"
    echo ""
    echo "Would you like to install Rust now? (y/n)"
    read -r choice
    if [[ "$choice" == "y" ]]; then
        echo "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to install Rust!"
            exit 1
        fi
        source $HOME/.cargo/env
        echo "Please reopen this terminal or run: source \$HOME/.cargo/env"
    fi
else
    echo "[2/4] Checking Rust..."
    rustc --version
    echo "OK!"
fi
echo ""

# Install npm dependencies
echo "[3/4] Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed!"
    exit 1
fi
echo "OK!"
echo ""

# Verify Tauri CLI
echo "[4/4] Verifying Tauri..."
npx tauri --version
echo "OK!"
echo ""

echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run the game: npm run dev"
echo "  2. Build: npm run build"
echo "  3. Read docs: TAURI_MIGRATION.md"
echo ""
