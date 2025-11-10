import { defineConfig } from "vite";
import path from "node:path";

const rootDir = path.resolve(__dirname, "src");
const outDir = path.resolve(__dirname, "build/renderer");

export default defineConfig({
  root: rootDir,
  base: "./",
  publicDir: path.resolve(__dirname, "Assets"),
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [rootDir, path.resolve(__dirname, "Assets")],
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        modelViewer: path.resolve(rootDir, "modelViewer.html"),
      },
    },
  },
});
