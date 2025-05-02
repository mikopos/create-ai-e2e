#!/usr/bin/env node
import { program } from "commander";
import { initProject } from "./init.js";
import { scanProject } from "./scan.js";
import { genTests } from "./gen.js";

program
.command("init")
.description("Add Playwright & config")
.action(initProject);

program
.command("scan <src>")
.description("Detect routes in React (default) or Vue with --vue, and output optionally as JSON with --json")
.option("--vue", "scan as a Vue project")
.option("--json", "output JSON only")
.action((src: string, options: { vue?: boolean; json?: boolean }) => {
  // Pass booleans directly to scanProject
  scanProject(src, options.vue ?? false, options.json ?? false);
});

program
.command("gen")
.description("Generate Playwright specs for discovered routes")
.option("--ai", "use Claude 3.7 to enrich tests")
.action((options: { ai?: boolean }) => {
  // pass only a boolean!
  genTests(!!options.ai);
});

program.parse();
