@echo off
echo.
echo 🎮 FIGHT VIRUS - UNIFIED LAUNCHER
echo =====================================
echo.
echo Starting Go Core Server (waiting for ready)...
start "Go Core - Port 9000" /D "E:\Fight Virus" cmd /c ".\bin\game-core"
echo ⏳ Waiting 3 seconds for Go server to initialize...
timeout /t 3 /nobreak

echo.
echo Starting Game Client on port 5173...
start "Fight Virus - Game" /D "E:\Fight Virus" cmd /c "npm run dev"

echo.
echo ✅ Both processes started!
echo    - Go Core:    http://localhost:9000
echo    - Game:       http://localhost:5173
echo.
echo Close this window when done. Both processes will continue running.
pause
