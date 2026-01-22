@echo off
REM Copy icon files for Tauri build
echo Copying icons for Tauri build...
copy "Assets\icon.ico" "icons\icon.ico" /Y
copy "Assets\icon.ico" "icons\icon.png" /Y
echo Icons copied successfully!
dir icons\
