# Testing the Packaged App

## What was fixed:

1. **Added `files` array to package.json** - Explicitly tells electron-builder which files to include in the package
2. **Added `asarUnpack` configuration** - Ensures the `build` folder is unpacked (not compressed in asar) so files can be accessed normally
3. **Fixed path resolution in main.js** - Uses different paths for packaged vs development mode:
   - Development: `__dirname/../build/renderer/index.html`
   - Packaged: `process.resourcesPath/app.asar.unpacked/build/renderer/index.html`
4. **Fixed background music bug** - Removed calls to non-existent `startBackgroundMusic()` method

## How to test:

1. Install the new setup file: `dist\Virus Hunter Setup 1.0.0.exe`
2. Run the installed game
3. You should see:
   - Intro sequence (6 seconds) with "EdgeRunners Studio Presents"
   - Start menu with buttons after intro completes
   - Full game functionality

## Expected behavior:

- **0-6 seconds**: Intro overlay with boot sequence animation
- **After 6 seconds**: Start screen with menu buttons appears
- **Click "LAUNCH PLAY MODE"**: Game starts with 3D environment
- **All assets load correctly**: Models, sounds, textures

## If it still doesn't work:

The app will log diagnostic information. To see logs:

1. After installing, run the app from Command Prompt:
   ```
   "C:\Users\[YourUser]\AppData\Local\Programs\virus-hunter\Virus Hunter.exe"
   ```
2. Look for warnings about missing files and their paths
3. Share the error messages

## Files that should be in the packaged app:

```
resources/
  app.asar              (contains src/main.js, package.json)
  app.asar.unpacked/    (contains build folder)
    build/
      renderer/
        index.html
        assets/
          index-*.js
        sounds/
        intro/
```
