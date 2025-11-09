const path = require("path");
const fs = require("fs/promises");

async function main() {
  const srcDir = path.resolve(__dirname, "..", "Assets");
  const outDir = path.resolve(__dirname, "..", "build", "Assets");

  await fs.mkdir(path.dirname(outDir), { recursive: true });
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.cp(srcDir, outDir, { recursive: true });
}

main().catch((error) => {
  console.error("Failed to copy Assets directory:", error);
  process.exitCode = 1;
});
