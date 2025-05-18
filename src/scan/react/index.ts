/* eslint-disable no-useless-escape */
// src/scan/react/index.ts
import fs from "fs";
import { sync as globSync } from "glob";
import logger from "../../logger";
// patterns, resolveImportPath, extractTags, extractChildren are used by parsers.ts
// They are not directly used in this file anymore but kept for potential direct use or clarity.
import "./patterns"; 
import "./fileUtils"; 
import "./extractorUtils"; 
import {
  parseExportedRoutes,
  parseImportedRoutes,
  parseRouteComponents,
  parseRouteConstants,
  parseRouteObjectPatterns,
  parseRoutesFile,
  parseRouterProviders
} from "./parsers";

export interface Route { // Exported
  path: string;
  component?: string;
  tags?: string[];
  children?: Route[];
}

export interface RoutesObject { // Exported
  path: string;
  element?: string;
  children?: RoutesObject[];
}

/**
 * Scan a React project directory for routes defined in various ways:
 * 1. <Route path="..."/> components
 * 2. Route constants used with RoutingProvider
 * 3. Route arrays or objects
 * 4. Routes defined in routes.tsx with RoutesObject type
 * 5. Routes used with createHashRouter in RouterProvider
 * 6. Routes defined in createBrowserRouter
 * 7. Routes defined in createMemoryRouter
 * 8. Routes defined in createRoutesFromElements
 *
 * @param rootDir - Absolute path to the project's src folder
 * @returns A list of discovered routes with their paths and metadata
 */
export async function scanReact(rootDir: string): Promise<Route[]> {
  logger.info(`🔍 Starting scan in directory: ${rootDir}`);

  // Verify directory exists
  if (!fs.existsSync(rootDir)) {
    logger.error(`❌ Directory does not exist: ${rootDir}`);
    return [];
  }

  const pattern = "**/*.{js,jsx,ts,tsx}";
  logger.info(`🔍 Using glob pattern: ${pattern}`);

  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  logger.info(`📁 Found ${files.length} files to scan:`);
  files.forEach(file => logger.info(`   - ${file}`));

  const routes = new Map<string, Route>();

  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) {
        logger.info(`⏭️  Skipping non-file: ${file}`);
        continue;
      }

      logger.info(`\n📄 Scanning file: ${file}`);
      const code = fs.readFileSync(file, "utf8");

      // Delegate parsing to specialized functions
      logger.info(`  Checking for exported routes in ${file}`);
      parseExportedRoutes(code, file, routes);

      logger.info(`  Checking for imported routes in ${file}`);
      parseImportedRoutes(code, file, routes);
      
      parseRouteComponents(code, routes);
      
      parseRouteConstants(code, routes);

      logger.info(`  Checking for React Router v6 patterns in ${file}`);
      parseRouteObjectPatterns(code, routes);
      
      // parseRouterProviders needs to be called before parseRoutesFile for some cases
      parseRouterProviders(code, file, routes); 
      
      parseRoutesFile(code, file, routes); 

    } catch (error) {
      logger.error({ err: error }, `❌ Error scanning file ${file}`);
    }
  }

  logger.info(`\n✅ Scan complete. Found ${routes.size} routes:`);
  routes.forEach((route, path) => {
    logger.info(`  • ${path}${route.component ? ` (component: ${route.component})` : ''}${route.tags?.length ? ` [tags: ${route.tags.join(', ')}]` : ''}`);
  });

  return Array.from(routes.values());
}