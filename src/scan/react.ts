// src/scan/react.ts
import fs from "fs";
import { sync as globSync } from "glob";

interface Route {
  path: string;
  component?: string;
  tags?: string[];
}

/**
 * Scan a React project directory for routes defined in various ways:
 * 1. <Route path="..."/> components
 * 2. Route constants used with RoutingProvider
 * 3. Route arrays or objects
 * 
 * @param rootDir - Absolute path to the project's src folder
 * @returns A list of discovered routes with their paths and metadata
 */
export async function scanReact(rootDir: string): Promise<Route[]> {
  const pattern = "**/*.{js,jsx,ts,tsx}";
  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  const routes = new Map<string, Route>();

  // Regex patterns for different route definitions
  const patterns = {
    // Direct Route components
    routeComponent: /<\s*Route[^>]*path\s*=\s*["'](.*?)["'][^>]*>/g,
    pathProp: /path\s*=\s*["'](.*?)["']/,
    
    // Route constants
    routeConst: /(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObject: /\{\s*path\s*:\s*["'](.*?)["']/g,
    
    // RoutingProvider usage
    routingProvider: /<\s*RoutingProvider[^>]*routes\s*=\s*{([^}]+)}[^>]*>/g,
    
    // Route tags in comments
    routeTags: /\/\/\s*@tags\s*([^\n]+)/g
  };

  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;

      const code = fs.readFileSync(file, "utf8");
      
      // 1. Find direct Route components
      const routeMatches = code.match(patterns.routeComponent);
      if (routeMatches) {
        for (const match of routeMatches) {
          const pathMatch = match.match(patterns.pathProp);
          if (pathMatch?.[1]) {
            const path = pathMatch[1].trim();
            const tags = extractTags(code, match);
            routes.set(path, { path, tags });
          }
        }
      }

      // 2. Find route constants
      const constMatches = code.match(patterns.routeConst);
      if (constMatches) {
        for (const match of constMatches) {
          const routeArray = match[2];
          const objectMatches = routeArray.match(patterns.routeObject);
          if (objectMatches) {
            for (const objMatch of objectMatches) {
              const pathMatch = objMatch.match(/path\s*:\s*["'](.*?)["']/);
              if (pathMatch?.[1]) {
                const path = pathMatch[1].trim();
                const tags = extractTags(code, objMatch);
                routes.set(path, { path, tags });
              }
            }
          }
        }
      }

      // 3. Find RoutingProvider usage
      const providerMatches = code.match(patterns.routingProvider);
      if (providerMatches) {
        for (const match of providerMatches) {
          const routesContent = match.match(/{([^}]+)}/)?.[1];
          if (routesContent) {
            // Extract route variable name
            const routeVarMatch = routesContent.match(/\b(\w+)\b/);
            if (routeVarMatch) {
              const routeVar = routeVarMatch[1];
              // Find the route variable definition
              const routeDefRegex = new RegExp(`(?:const|let|var)\\s+${routeVar}\\s*=\\s*\\[(([\\s\\S])*?)\\]`);
              const routeDef = code.match(routeDefRegex);
              if (routeDef) {
                const routeObjects = routeDef[1].match(patterns.routeObject);
                if (routeObjects) {
                  for (const obj of routeObjects) {
                    const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                    if (pathMatch?.[1]) {
                      const path = pathMatch[1].trim();
                      const tags = extractTags(code, obj);
                      routes.set(path, { path, tags });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${file}:`, error);
    }
  }

  return Array.from(routes.values());
}

/**
 * Extract tags from comments above a route definition
 */
function extractTags(code: string, routeMatch: string): string[] {
  const tags: string[] = [];
  const lines = code.split('\n');
  const routeLine = lines.findIndex(line => line.includes(routeMatch));
  
  // Look for tags in comments above the route
  for (let i = routeLine - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('//')) break;
    
    const tagMatch = line.match(/@tags\s+([^\n]+)/);
    if (tagMatch) {
      tags.push(...tagMatch[1].split(',').map(tag => tag.trim()));
      break;
    }
  }
  
  return tags;
}

// Example usage:
const routes = await scanReact('/path/to/src');
console.log('Found routes:', routes);

// Example route definitions that will be detected:

// 1. Direct Route components
/*
<Route path="/home" component={Home} />
*/

// 2. Route constants
/*
const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/profile', component: Profile }
];
*/

// 3. RoutingProvider usage
/*
const appRoutes = [
  // @tags public,main
  { path: '/about', component: About },
  // @tags private,admin
  { path: '/admin', component: Admin }
];

<RoutingProvider routes={appRoutes}>
  <App />
</RoutingProvider>
*/

// 4. Nested routes
/*
const routes = [
  {
    path: '/app',
    component: AppLayout,
    children: [
      { path: '/dashboard', component: Dashboard },
      { path: '/settings', component: Settings }
    ]
  }
];
*/

// 5. Route objects with metadata
/*
const routes = [
  {
    path: '/products',
    component: Products,
    meta: {
      auth: true,
      roles: ['admin']
    }
  }
];
*/