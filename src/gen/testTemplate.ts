import logger from "../logger";

export const makeSpec = (
    route: string,
    rootSel = "body",
    expectedTitle?: string,
    extra: string[] = []
) => `import { test, expect } from "@playwright/test";
import { AxeBuilder } from '@axe-core/playwright';

test("${route} renders, is accessible, and has no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logger.error(\`Playwright Console Error: \${msg.text()}\`);
      consoleErrors.push(\`[Console error]: \${msg.text()}\`);
    }
  });

  await page.goto("${route}");

  await expect(page).toHaveTitle(expectedTitle ? "${expectedTitle}" : /./);

  await expect(page.locator("${rootSel}")).toBeVisible({ timeout: 10000 });

  const accessibilityScanResults = await new AxeBuilder({ page })
    .exclude('iframe') 
    .analyze();
  
  if (accessibilityScanResults.violations.length > 0) {
    logger.error("Accessibility violations found:");
    accessibilityScanResults.violations.forEach(violation => {
      logger.error(\`  ID: \${violation.id}\`);
      logger.error(\`  Impact: \${violation.impact}\`);
      logger.error(\`  Description: \${violation.description}\`);
      logger.error(\`  Help: \${violation.help}\`);
      logger.error(\`  Help URL: \${violation.helpUrl}\`);
      violation.nodes.forEach(node => {
        logger.error(\`    Node HTML: \${node.html}\`);
        logger.error(\`    Node Target: \${node.target.join(', ')}\`);
      });
    });
  }
  expect(accessibilityScanResults.violations).toEqual([]);

  ${extra.length > 0 ? extra.join("\n  ") : '// No extra checks provided.'}

  expect(consoleErrors).toEqual([]);
});
`;
