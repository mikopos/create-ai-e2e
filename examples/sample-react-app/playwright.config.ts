import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,

  webServer: {
    // 1) Command to start your app. Vite’s dev server runs on 5173 by default.
    command: "npm run dev",
    // 2) Poll this URL until it returns 2xx/3xx.
    url: "http://localhost:5173",
    // 3) Give it up to 2 minutes to come up (defaults to 60s).
    timeout: 120_000,
    // 4) If a server’s already running in dev mode, reuse it instead of spawning a new one.
    reuseExistingServer: !process.env.CI,
  },

  use: {
    headless: true,
    // Base URL for `page.goto('/')` and `page.goto('/about')`
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5_000,
    ignoreHTTPSErrors: true,
  },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],


  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
