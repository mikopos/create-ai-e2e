import { test, expect } from "@playwright/test";

test("/about renders", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("body")).toBeVisible();
  
});
