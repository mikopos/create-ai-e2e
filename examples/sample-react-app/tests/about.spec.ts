import { test, expect } from "@playwright/test";

test("/about renders", async ({ page }) => {
  await page.goto("/about");
  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");
  // Wait for the body to be visible
  await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
});
