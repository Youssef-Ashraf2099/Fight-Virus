const fs = require("fs");
const path = require("path");

async function main() {
  const rendererDir = path.resolve(__dirname, "..", "build", "renderer");
  const indexHtmlPath = path.join(rendererDir, "index.html");

  if (!fs.existsSync(indexHtmlPath)) {
    console.warn(
      "finalize-html: index.html not found, skipping html verification."
    );
    return;
  }

  const html = await fs.promises.readFile(indexHtmlPath, "utf8");

  // Verify that Vite has injected the script tag
  if (
    html.includes('<script type="module"') &&
    html.includes('src="./assets/')
  ) {
    console.log("✓ Build successful - script tag properly injected by Vite");
  } else {
    console.warn("⚠ Warning: No module script tag found in built HTML");
  }
}

main().catch((error) => {
  console.error("Failed to verify renderer HTML:", error);
  process.exitCode = 1;
});
