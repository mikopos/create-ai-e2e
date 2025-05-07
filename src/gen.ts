#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { scanReact } from "./scan/react.js";
import { scanVue } from "./scan/vue.js";
import { makeSpec } from "./gen/testTemplate.js";
import { enrichAssertions } from "./ai/claude.js";
import { enrichAssertionsOpenAI } from "./ai/openai.js";
import {enrichAssertionsHuggingFace} from "./ai/huggingface.js";

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
export async function genTests(useAI: boolean = false): Promise<void> {
  console.log(`🧪 Generating tests (AI enabled: ${useAI})`);

  const srcDir = path.resolve(process.cwd(), "src");
  const isVue = fs.existsSync(path.join(srcDir, "router"));

  const routes: Route[] = isVue
      ? await scanVue(srcDir)
      : await scanReact(srcDir);

  const testsDir = path.resolve(process.cwd(), "tests");
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }

  for (const route of routes) {
    const slug = route.path === "/"
        ? "home"
        : route.path.replace(/^\//, "").replace(/\//g, "_");
    const specPath = path.join(testsDir, `${slug}.spec.ts`);

    let extra: string[] = [];
    if (useAI) {
      try {
        extra = await enrichAssertions(route.path);
      } catch (err) {
        console.warn(`⚠️ Claude enrichment failed for ${route.path}:`, err);

        try {
          console.log(`🔄 Falling back to OpenAI for ${route.path}`);
          extra = await enrichAssertionsOpenAI(route.path);
        } catch (err2) {
          console.warn(`⚠️ OpenAI enrichment also failed for ${route.path}:`, err2);

          try {
            console.log(`🔄 Falling back to Hugging Face for ${route.path}`);
            extra = await enrichAssertionsHuggingFace(route.path);
          } catch (err2) {
            console.warn(`⚠️ Hugging Face enrichment also failed for ${route.path}:`, err2);
          }
        }
      }
    }

    const content = makeSpec(route.path, "body", extra);
    fs.writeFileSync(specPath, content, "utf8");
    console.log(`Created ${specPath}`);
  }

  console.log(`✅ Generated ${routes.length} test(s) in tests/`);
}