#!/bin/bash

echo ""
echo "🎮 FIGHT VIRUS - UNIFIED LAUNCHER"
echo "====================================="
echo ""

echo "Starting Go Core Server..."
./bin/game-core &
GO_PID=$!
sleep 2

echo "Starting Game Client..."
npm run dev &
NPM_PID=$!

echo ""
echo "✅ Both processes started!"
echo "   - Go Core:    http://localhost:9000 (PID: $GO_PID)"
echo "   - Game:       http://localhost:5173 (PID: $NPM_PID)"
echo ""
echo "Press Ctrl+C to stop all processes."
echo ""

# Wait for both to finish
wait
