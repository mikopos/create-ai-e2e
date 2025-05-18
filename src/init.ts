// src/init.ts
import { execa } from "execa";
import fs from "fs";
import path from "path";
import logger from "./logger";

export async function initProject() {
  logger.info("🔧 Installing Playwright browsers…");
  try {
    await execa("npx", ["playwright", "install"], { stdio: "inherit" });
  } catch (e) {
    logger.error({ err: e }, "❌ Failed to install Playwright browsers");
    process.exit(1);
  }

  const configPath = path.resolve(process.cwd(), "playwright.config.ts");
  if (fs.existsSync(configPath)) {
    logger.warn("⚠️  playwright.config.ts already exists, skipping");
    return;
  }

  logger.info("📄 Writing playwright.config.ts");
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
  logger.info("✅ Initialization complete! Run `npx create-ai-e2e scan src/` next.");
}