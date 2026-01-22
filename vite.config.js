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
          three: ["./lib/three.min.js"],
          vendor: ["node_modules"],
        },
      },
    },
    // Enable CSS minification and optimization
    cssMinify: "lightningcss",
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
