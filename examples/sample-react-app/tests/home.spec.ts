import { test, expect } from "@playwright/test";

test("/ renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  
});
