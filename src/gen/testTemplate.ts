export const makeSpec = (
    route: string,
    rootSel = "body",
    extra: string[] = []
) => `import { test, expect } from "@playwright/test";

test("${route} renders", async ({ page }) => {
  await page.goto("${route}");
  await expect(page.locator("${rootSel}")).toBeVisible();
  ${extra.join("\n  ")}
});
`;
