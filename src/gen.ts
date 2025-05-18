#!/usr/bin/env node
import path from "path";
import fs from "fs";
import { scanProject } from "./scan";
import { enrichAssertions } from "./ai/claude";
import { enrichAssertionsOpenAI } from "./ai/openai";
import { enrichAssertionsHuggingFace } from "./ai/huggingface";
import { makeSpec } from "./gen/testTemplate";
import logger from "./logger";

interface Route {
  path: string;
  component?: string;
  tags?: string[];
}

/**
 * Generates Playwright smoke tests for each discovered route,
 * optionally enriched with AI assertions via Claude.
 *
 * @param useAI - Whether to call Claude for extra assertions
 */
export async function generateTests(
  srcDir: string,
  useAI: boolean = true
): Promise<void> {
  logger.info(`🧪 Generating tests (AI enabled: ${useAI})`);

  const routes = await scanProject(srcDir);
  if (routes.length === 0) {
    logger.warn("No routes found to generate tests for");
    return;
  }

  // Create tests directory if it doesn't exist
  const testDir = path.join(process.cwd(), "tests");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  for (const route of routes) {
    const specPath = path.join(testDir, `${route.path.replace(/\//g, "-")}.spec.ts`);
    let assertions: string[] = [];

    if (useAI) {
      try {
        assertions = await enrichAssertions(route.path);
      } catch (err) {
        logger.warn({ err, path: route.path }, `⚠️ Claude enrichment failed`);
        try {
          logger.info(`🔄 Falling back to OpenAI for ${route.path}`);
          assertions = await enrichAssertionsOpenAI(route.path);
        } catch (err2) {
          logger.warn({ err: err2, path: route.path }, `⚠️ OpenAI enrichment also failed`);
          try {
            logger.info(`🔄 Falling back to Hugging Face for ${route.path}`);
            assertions = await enrichAssertionsHuggingFace(route.path);
          } catch (err3) {
            logger.warn({ err: err3, path: route.path }, `⚠️ Hugging Face enrichment also failed`);
          }
        }
      }
    }

    const testContent = makeSpec(route.path, "body", undefined, assertions);
    fs.writeFileSync(specPath, testContent);
    logger.info(`Created ${specPath}`);
  }

  logger.info(`✅ Generated ${routes.length} test(s) in tests/`);
}