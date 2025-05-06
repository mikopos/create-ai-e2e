// src/scan.ts
import path from "path";
import { scanReact } from "./scan/react.js";
import { scanVue } from "./scan/vue.js";
import fs from "fs";

/**
 * Scan project for route paths and output them.
 *
 * @param srcDir - Path to the project's src directory
 * @param isVue - Scan as Vue project if true (default React)
 * @param outputJson - Print raw JSON if true; otherwise, pretty-print
 */
export async function scanProject(
  srcDir: string,
  isVue: boolean = false,
  outputJson: boolean = false
): Promise<void> {
  const abs = path.resolve(process.cwd(), srcDir);

  let scanDir = abs;
  try {
    if (!fs.existsSync(scanDir) || !fs.statSync(scanDir).isDirectory()) {
      const alt = path.join(abs, "src");
      if (fs.existsSync(alt) && fs.statSync(alt).isDirectory()) {
        scanDir = alt;
      } else {
        console.error(`❌ Path not found: ${scanDir}`);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(`❌ Error accessing path: ${scanDir}`, err);
    process.exit(1);
  }

  const routes: string[] = isVue
    ? await scanVue(scanDir)
    : await scanReact(scanDir);

  if (outputJson) {
    console.log(JSON.stringify(routes, null, 2));
  } else {
    console.log("🔍 Found routes:");
    if (routes.length === 0) {
      console.log("  (no routes found)");
    } else {
      routes.forEach(r => console.log("  •", r));
    }
  }
}
