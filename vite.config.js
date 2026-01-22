import { defineConfig } from "vite";
import path from "node:path";

const rootDir = path.resolve(__dirname, "src");
const outDir = path.resolve(__dirname, "build/renderer");

// Use Tauri's environment variables if available
const isTauri =
  !!process.env.TAURI_ENV_DEBUG || !!process.env.TAURI_ENV_TARGET_TRIPLE;

export default defineConfig({
  root: rootDir,
  base: isTauri ? "./" : "./",
  publicDir: path.resolve(__dirname, "Assets"),
  server: {
    port: 5173,
    strictPort: false,
    fs: {
      allow: [rootDir, path.resolve(__dirname, "Assets")],
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    assetsDir: "assets",
    // Performance optimizations
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    // Enable code splitting for better caching
    rollupOptions: {
      input: path.resolve(rootDir, "index.html"),
      output: {
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash][extname]",
        // Optimize chunk splitting
        manualChunks: {
          vendor: ["three"],
        },
      },
    },
    // Enable CSS minification and optimization
    cssMinify: "esbuild",
    // Reduce bundle size
    brotliSize: false,
    sourcemap: false,
    // Optimize for production
    reportCompressedSize: false,
  },
  // Performance hints
  logLevel: "warn",
  optimizeDeps: {
    exclude: ["electron"],
    esbuildOptions: {
      target: "esnext",
      supported: {
        bigint: true,
      },
    },
  },
});
