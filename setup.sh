#!/bin/bash

echo "=========================================="
echo "  Virus Hunter - Setup Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully!"
echo ""

# Download Three.js
echo "📥 Downloading Three.js library..."
mkdir -p src/lib

curl -o src/lib/three.module.js https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js

if [ $? -ne 0 ]; then
    echo "⚠️  Failed to download Three.js automatically"
    echo "Please download manually from:"
    echo "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    echo "And save it to: src/lib/three.module.js"
else
    echo "✅ Three.js downloaded successfully!"
fi

echo ""
echo "=========================================="
echo "  Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "To start the game:"
echo "  npm run dev     # Development mode (with DevTools)"
echo "  npm start       # Production mode"
echo ""
echo "To build executables:"
echo "  npm run build:win    # Windows"
echo "  npm run build:mac    # macOS"
echo "  npm run build:linux  # Linux"
echo ""
echo "Happy virus hunting! 🎮"
