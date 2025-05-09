// src/scan/react.ts
import fs from "fs";
import { sync as globSync } from "glob";

interface Route {
  path: string;
  component?: string;
  tags?: string[];
}

interface RoutesObject {
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
 * 
 * @param rootDir - Absolute path to the project's src folder
 * @returns A list of discovered routes with their paths and metadata
 */
export async function scanReact(rootDir: string): Promise<Route[]> {
  const pattern = "**/*.{js,jsx,ts,tsx}";
  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  const routes = new Map<string, Route>();

  const patterns = {
    routeComponent: /<\s*Route[^>]*path\s*=\s*["'](.*?)["'][^>]*>/g,
    pathProp: /path\s*=\s*["'](.*?)["']/,
    
    routeConst: /(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObject: /\{\s*path\s*:\s*["'](.*?)["']/g,
    
    routingProvider: /<\s*RoutingProvider[^>]*routes\s*=\s*{([^}]+)}[^>]*>/g,
    
    routeTags: /\/\/\s*@tags\s*([^\n]+)/g,

    routesObjectType: /type\s+RoutesObject\s*=\s*\{([^}]+)\}/g,
    
    routesConst: /(?:const|let|var)\s+(\w+)\s*:\s*RoutesObject\s*\[\s*\]\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    
    routerProvider: /<\s*RouterProvider[^>]*router\s*=\s*{([^}]+)}[^>]*>/g,

    createHashRouter: /createHashRouter\(([^)]+)\)/g,

    // New pattern for imported routes
    importRoutes: /import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g
  };

  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;

      const code = fs.readFileSync(file, "utf8");
      
      // Scan for Route components
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

      // Scan for route constants
      const constMatches = code.match(patterns.routeConst);
      if (constMatches) {
        for (const match of constMatches) {
          const routeArray = match[2];
          if (routeArray) {
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
      }

      // Scan for RouterProvider with createHashRouter
      const routerProviderMatches = code.match(patterns.routerProvider);
      if (routerProviderMatches) {
        for (const match of routerProviderMatches) {
          const routerContent = match.match(/{([^}]+)}/)?.[1];
          if (routerContent) {
            // Check for createHashRouter
            const hashRouterMatch = routerContent.match(patterns.createHashRouter);
            if (hashRouterMatch) {
              const routesVarMatch = hashRouterMatch[1].match(/\b(\w+)\b/);
              if (routesVarMatch) {
                const routesVar = routesVarMatch[1];
                
                // First try to find routes in the same file
                const routeDefRegex = new RegExp(`(?:const|let|var)\\s+${routesVar}\\s*=\\s*\\[(([\\s\\S])*?)\\]`);
                const routeDef = code.match(routeDefRegex);
                
                if (routeDef?.[1]) {
                  // Routes defined in the same file
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
                } else {
                  // Look for imported routes
                  const importMatches = code.match(patterns.importRoutes);
                  if (importMatches) {
                    for (const importMatch of importMatches) {
                      const importPath = importMatch.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                      if (importPath) {
                        // Try to resolve the imported file
                        const importedFilePath = resolveImportPath(file, importPath);
                        if (importedFilePath) {
                          try {
                            const importedCode = fs.readFileSync(importedFilePath, 'utf8');
                            const importedRouteDef = importedCode.match(/(?:export\s+default\s+)?(?:const|let|var)\s+(\w+)\s*=\s*\[(([\s\S])*?)\]/);
                            if (importedRouteDef?.[2]) {
                              const routeObjects = importedRouteDef[2].match(patterns.routeObject);
                              if (routeObjects) {
                                for (const obj of routeObjects) {
                                  const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                                  if (pathMatch?.[1]) {
                                    const path = pathMatch[1].trim();
                                    const tags = extractTags(importedCode, obj);
                                    routes.set(path, { path, tags });
                                  }
                                }
                              }
                            }
                          } catch (error) {
                            console.error(`Error reading imported file ${importedFilePath}:`, error);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Scan for RoutingProvider usage
      const providerMatches = code.match(patterns.routingProvider);
      if (providerMatches) {
        for (const match of providerMatches) {
          const routesContent = match.match(/{([^}]+)}/)?.[1];
          if (routesContent) {
            const routeVarMatch = routesContent.match(/\b(\w+)\b/);
            if (routeVarMatch) {
              const routeVar = routeVarMatch[1];
              const routeDefRegex = new RegExp(`(?:const|let|var)\\s+${routeVar}\\s*=\\s*\\[(([\\s\\S])*?)\\]`);
              const routeDef = code.match(routeDefRegex);
              if (routeDef?.[1]) {
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

      // Scan for routes.tsx pattern
      if (file.endsWith('routes.tsx')) {
        // Look for simple routes constant without type
        const simpleRoutesMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g);
        if (simpleRoutesMatch) {
          for (const match of simpleRoutesMatch) {
            const routeObjects = match.match(patterns.routeObject);
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

        // Existing RoutesObject type scanning
        const typeMatch = code.match(patterns.routesObjectType);
        if (typeMatch) {
          const routesConstMatch = code.match(patterns.routesConst);
          if (routesConstMatch?.[2]) {
            const routesArray = routesConstMatch[2];
            const routeObjects = routesArray.match(patterns.routeObject);
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
    } catch (error) {
      console.error(`Error scanning file ${file}:`, error);
    }
  }

  return Array.from(routes.values());
}

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(currentFile: string, importPath: string): string | null {
  try {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
      const resolvedPath = importPath.replace(/^\./, currentDir);
      return resolvedPath + (resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.ts') ? '' : '.tsx');
    }
    
    // Handle absolute imports (from src)
    if (importPath.startsWith('src/')) {
      const rootDir = currentFile.substring(0, currentFile.indexOf('src/'));
      return rootDir + importPath + (importPath.endsWith('.tsx') || importPath.endsWith('.ts') ? '' : '.tsx');
    }
    
    return null;
  } catch (error) {
    console.error(`Error resolving import path ${importPath}:`, error);
    return null;
  }
}

/**
 * Extract tags from comments above a route definition
 */
function extractTags(code: string, routeMatch: string): string[] {
  const tags: string[] = [];
  const lines = code.split('\n');
  const routeLine = lines.findIndex(line => line.includes(routeMatch));
  
  if (routeLine === -1) return tags;
  
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

const routes = await scanReact('/path/to/src');
console.log('Found routes:', routes);