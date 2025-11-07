Place your icon files here before packaging the app.

- Windows (.ico): assets/icon.ico <-- required by package.json for Windows build
- macOS (.icns): assets/icon.icns <-- required by package.json for macOS build
- Linux (.png): assets/icon.png <-- required by package.json for Linux/AppImage build

If you received an `icon.ico` attachment, copy it into this folder and rename to `icon.ico`.
During development Electron will use `assets/icon.ico` if present, otherwise it will fall back to `assets/icon.png` if available.

NOTE: Icon files are binary; this README is a placeholder created by the build tooling.
