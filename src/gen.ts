#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { scanReact } from "./scan/react.js";
import { scanVue } from "./scan/vue.js";
import { makeSpec } from "./gen/testTemplate.js";
import { enrichAssertions } from "./ai/claude.js";
import { enrichAssertionsOpenAI } from "./ai/openai.js";
import {enrichAssertionsHuggingFace} from "./ai/huggingface.js";


/**
 * Generates Playwright smoke tests for each discovered route,
 * optionally enriched with AI assertions via Claude.
 *
 * @param useAI - Whether to call Claude for extra assertions
 */
export async function genTests(useAI: boolean = false): Promise<void> {
  console.log(`🧪 Generating tests (AI enabled: ${useAI})`);

  const srcDir = path.resolve(process.cwd(), "src");
  const isVue = fs.existsSync(path.join(srcDir, "router"));

  // Discover routes based on framework
  const routes: string[] = isVue
      ? await scanVue(srcDir)
      : await scanReact(srcDir);

  // Ensure `tests/` directory exists
  const testsDir = path.resolve(process.cwd(), "tests");
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }

  // Generate a spec file per route
  for (const route of routes) {
    // Create a URL-friendly slug: '/' -> 'home'; '/about/team' -> 'about_team'
    const slug = route === "/"
        ? "home"
        : route.replace(/^\//, "").replace(/\//g, "_");
    const specPath = path.join(testsDir, `${slug}.spec.ts`);

    // AI enrichment if requested
    let extra: string[] = [];
    if (useAI) {
      try {
        // Pass the raw route or component source to Claude
        extra = await enrichAssertions(route);
      } catch (err) {
        console.warn(`⚠️ Claude enrichment failed for ${route}:`, err);

        // Fallback to OpenAI
        try {
          console.log(`🔄 Falling back to OpenAI for ${route}`);
          extra = await enrichAssertionsOpenAI(route);
        } catch (err2) {
          console.warn(`⚠️ OpenAI enrichment also failed for ${route}:`, err2);

          // Fallback to huggingFace
          try {
            console.log(`🔄 Falling back to Hugging Face for ${route}`);
            extra = await enrichAssertionsHuggingFace(route);
          } catch (err2) {
            console.warn(`⚠️ Hugging Face enrichment also failed for ${route}:`, err2);
          }
        }
      }
    }

    // Generate and write the test
    const content = makeSpec(route, "body", extra);
    fs.writeFileSync(specPath, content, "utf8");
    console.log(`Created ${specPath}`);
  }

  console.log(`✅ Generated ${routes.length} test(s) in tests/`);
}