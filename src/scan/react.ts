// src/scan/react.ts
import fs from "fs";
import { sync as globSync } from "glob";

interface Route {
  path: string;
  component?: string;
  tags?: string[];
  children?: Route[];
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
 * 6. Routes defined in createBrowserRouter
 * 7. Routes defined in createMemoryRouter
 * 8. Routes defined in createRoutesFromElements
 * 
 * @param rootDir - Absolute path to the project's src folder
 * @returns A list of discovered routes with their paths and metadata
 */
export async function scanReact(rootDir: string): Promise<Route[]> {
  const pattern = "**/*.{js,jsx,ts,tsx}";
  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  const routes = new Map<string, Route>();

  const patterns = {
    // Route component patterns
    routeComponent: /<\s*Route[^>]*path\s*=\s*["'](.*?)["'][^>]*>/g,
    pathProp: /path\s*=\s*["'](.*?)["']/,
    elementProp: /element\s*=\s*{([^}]+)}/,
    
    // Route array patterns
    routeConst: /(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObject: /\{\s*path\s*:\s*["'](.*?)["']/g,
    
    // Router provider patterns
    routingProvider: /<\s*RoutingProvider[^>]*routes\s*=\s*{([^}]+)}[^>]*>/g,
    routerProvider: /<\s*RouterProvider[^>]*router\s*=\s*{([^}]+)}[^>]*>/g,
    
    // Router creation patterns
    createHashRouter: /createHashRouter\(([^)]+)\)/g,
    createBrowserRouter: /createBrowserRouter\(([^)]+)\)/g,
    createMemoryRouter: /createMemoryRouter\(([^)]+)\)/g,
    createRoutesFromElements: /createRoutesFromElements\(([^)]+)\)/g,
    
    // Import patterns
    importRoutes: /import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    
    // Tag patterns
    routeTags: /\/\/\s*@tags\s*([^\n]+)/g,
    
    // Type patterns
    routesObjectType: /type\s+RoutesObject\s*=\s*\{([^}]+)\}/g,
    routesConst: /(?:const|let|var)\s+(\w+)\s*:\s*RoutesObject\s*\[\s*\]\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
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
            const elementMatch = match.match(patterns.elementProp);
            const component = elementMatch?.[1]?.trim();
            const tags = extractTags(code, match);
            routes.set(path, { path, component, tags });
          }
        }
      }

      // Scan for route constants
      const constMatches = code.match(patterns.routeConst);
      if (constMatches) {
        for (const match of constMatches) {
          if (!match) continue;
          const routeArray = match[2];
          if (routeArray) {
            const objectMatches = routeArray.match(patterns.routeObject);
            if (objectMatches) {
              for (const objMatch of objectMatches) {
                const pathMatch = objMatch.match(/path\s*:\s*["'](.*?)["']/);
                if (pathMatch?.[1]) {
                  const path = pathMatch[1].trim();
                  const tags = extractTags(code, objMatch);
                  const children = extractChildren(routeArray, objMatch);
                  routes.set(path, { path, tags, children });
                }
              }
            }
          }
        }
      }

      // Scan for router providers
      const routerProviders = [
        patterns.routerProvider,
        patterns.routingProvider
      ];

      for (const providerPattern of routerProviders) {
        const providerMatches = code.match(providerPattern);
        if (providerMatches) {
          for (const match of providerMatches) {
            if (!match) continue;
            const routerContent = match.match(/{([^}]+)}/)?.[1];
            if (routerContent) {
              // Check for various router creation methods
              const routerPatterns = [
                patterns.createHashRouter,
                patterns.createBrowserRouter,
                patterns.createMemoryRouter,
                patterns.createRoutesFromElements
              ];

              for (const routerPattern of routerPatterns) {
                const routerMatch = routerContent.match(routerPattern);
                if (routerMatch) {
                  const routesVarMatch = routerMatch[1].match(/\b(\w+)\b/);
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
                            const children = extractChildren(routeDef[1], obj);
                            routes.set(path, { path, tags, children });
                          }
                        }
                      }
                    } else {
                      // Look for imported routes
                      const importMatches = code.match(patterns.importRoutes);
                      if (importMatches) {
                        for (const importMatch of importMatches) {
                          if (!importMatch) continue;
                          const importPath = importMatch.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                          if (importPath) {
                            // Try to resolve the imported file
                            const importedFilePath = resolveImportPath(file, importPath);
                            if (importedFilePath) {
                              try {
                                const importedCode = fs.readFileSync(importedFilePath, 'utf8');
                                const importedRouteDef = importedCode.match(/(?:export\s+default\s+)?(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\]/);
                                if (importedRouteDef?.[2]) {
                                  const routeObjects = importedRouteDef[2].match(patterns.routeObject);
                                  if (routeObjects) {
                                    for (const obj of routeObjects) {
                                      const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                                      if (pathMatch?.[1]) {
                                        const path = pathMatch[1].trim();
                                        const tags = extractTags(importedCode, obj);
                                        const children = extractChildren(importedRouteDef[2], obj);
                                        routes.set(path, { path, tags, children });
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
                  const children = extractChildren(match, obj);
                  routes.set(path, { path, tags, children });
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
                  const children = extractChildren(routesArray, obj);
                  routes.set(path, { path, tags, children });
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

/**
 * Extract children routes from a route object
 */
function extractChildren(routeArray: string, routeMatch: string): Route[] | undefined {
  const children: Route[] = [];
  const childrenMatch = routeMatch.match(/children\s*:\s*\[([\s\S]*?)\]/);
  
  if (childrenMatch?.[1]) {
    const childrenArray = childrenMatch[1];
    const childObjects = childrenArray.match(/\{\s*path\s*:\s*["'](.*?)["']/g);
    
    if (childObjects) {
      for (const child of childObjects) {
        const pathMatch = child.match(/path\s*:\s*["'](.*?)["']/);
        if (pathMatch?.[1]) {
          const path = pathMatch[1].trim();
          const tags = extractTags(routeArray, child);
          const grandChildren = extractChildren(childrenArray, child);
          children.push({ path, tags, children: grandChildren });
        }
      }
    }
  }
  
  return children.length > 0 ? children : undefined;
}