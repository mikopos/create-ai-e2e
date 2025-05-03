import { test, expect } from "@playwright/test";

test("/ renders", async ({ page }) => {
  try {
    await page.goto("/");
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");
    // Wait for the body to be visible
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
});
