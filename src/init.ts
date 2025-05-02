// src/init.ts
import { execa } from "execa";
import fs from "fs";
import path from "path";

export async function initProject() {
  console.log("🔧 Installing Playwright browsers…");
  try {
    // Step 1: install browsers
    await execa("npx", ["playwright", "install"], { stdio: "inherit" });
  } catch (e) {
    console.error("❌ Failed to install Playwright browsers", e);
    process.exit(1);
  }

  // Step 2: scaffold config
  const configPath = path.resolve(process.cwd(), "playwright.config.ts");
  if (fs.existsSync(configPath)) {
    console.log("⚠️  playwright.config.ts already exists, skipping");
    return;
  }

  console.log("📄 Writing playwright.config.ts");
  const configContents = `import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5_000,
    ignoreHTTPSErrors: true,
  },
});
`;
  fs.writeFileSync(configPath, configContents, "utf8");
  console.log("✅ Initialization complete! Run `npx create-ai-e2e scan src/` next.");
}