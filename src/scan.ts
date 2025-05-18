// src/scan.ts
import path from "path";
import { scanReact } from "./scan/react";
import { scanVue } from "./scan/vue";
import fs from "fs";
import logger from "./logger";

interface Route {
  path: string;
  component?: string;
  tags?: string[];
}

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
): Promise<Route[]> {
  const abs = path.resolve(process.cwd(), srcDir);

  let scanDir = abs;
  try {
    if (!fs.existsSync(scanDir) || !fs.statSync(scanDir).isDirectory()) {
      const alt = path.join(abs, "src");
      if (fs.existsSync(alt) && fs.statSync(alt).isDirectory()) {
        scanDir = alt;
      } else {
        logger.error(`❌ Path not found: ${scanDir}`);
        process.exit(1);
      }
    }
  } catch (err) {
    logger.error({ err }, `❌ Error accessing path: ${scanDir}`);
    process.exit(1);
  }

  const routes: Route[] = isVue
    ? await scanVue(scanDir)
    : await scanReact(scanDir);

  if (outputJson) {
    logger.info(JSON.stringify(routes, null, 2));
  } else {
    logger.info("🔍 Found routes:");
    if (routes.length === 0) {
      logger.info("  (no routes found)");
    } else {
      routes.forEach(r => logger.info("  •", r.path));
    }
  }

  return routes;
}
