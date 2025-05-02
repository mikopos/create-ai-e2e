// src/scan/react.ts
import fs from "fs";
import { sync as globSync } from "glob";

/**
 * Scan a React project directory for <Route path="..."/> usages and return unique route paths.
 *
 * This implementation uses a simplified regex approach instead of Babel to avoid
 * module compatibility issues.
 *
 * @param rootDir - Absolute path to the project's src folder
 * @returns A list of discovered route paths
 */
export async function scanReact(rootDir: string): Promise<string[]> {
  const pattern = "**/*.{js,jsx,ts,tsx}";
  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  const routes = new Set<string>();

  // Regex patterns to match Route components and their path props
  const routeComponentRegex = /<\s*Route[^>]*path\s*=\s*["'](.*?)["'][^>]*>/g;
  const pathPropRegex = /path\s*=\s*["'](.*?)["']/;

  for (const file of files) {
    // Ensure it's a file
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    // Read file
    let code: string;
    try {
      code = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    // Find all Route components with path props
    const routeMatches = code.match(routeComponentRegex);
    if (!routeMatches) continue;

    // Extract path values from each Route component
    for (const routeMatch of routeMatches) {
      const pathMatch = routeMatch.match(pathPropRegex);
      if (pathMatch && pathMatch[1]) {
        const pathValue = pathMatch[1].trim();
        if (pathValue) {
          routes.add(pathValue);
        }
      }
    }
  }

  return Array.from(routes);
}