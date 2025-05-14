// src/scan/react/index.ts
import fs from "fs";
import { sync as globSync } from "glob";
import { patterns } from "./react/patterns";

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
  console.log(`🔍 Starting scan in directory: ${rootDir}`);
  
  // Verify directory exists
  if (!fs.existsSync(rootDir)) {
    console.error(`❌ Directory does not exist: ${rootDir}`);
    return [];
  }
  
  const pattern = "**/*.{js,jsx,ts,tsx}";
  console.log(`🔍 Using glob pattern: ${pattern}`);
  
  const files = globSync(pattern, { cwd: rootDir, absolute: true });
  console.log(`📁 Found ${files.length} files to scan:`);
  files.forEach(file => console.log(`   - ${file}`));
  
  const routes = new Map<string, Route>();

  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) {
        console.log(`⏭️  Skipping non-file: ${file}`);
        continue;
      }

      console.log(`\n📄 Scanning file: ${file}`);
      const code = fs.readFileSync(file, "utf8");
      
      // First check for exported routes
      console.log(`  Checking for exported routes in ${file}`);
      
      // Check for named exports
      const exportConstMatch = code.match(patterns.exportConst);
      if (exportConstMatch) {
        console.log(`  Found exported constant: ${exportConstMatch[0]}`);
        for (const match of exportConstMatch) {
          const routeArray = match.match(/\[([\s\S]*?)\]/)?.[1];
          if (routeArray) {
            console.log(`  Processing exported route array: ${routeArray}`);
            const routeObjects = routeArray.match(patterns.routeObjectPath);
            if (routeObjects) {
              for (const obj of routeObjects) {
                const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                if (pathMatch?.[1]) {
                  const path = pathMatch[1].trim();
                  const tags = extractTags(code, obj);
                  const children = extractChildren(routeArray, obj);
                  routes.set(path, { path, tags, children });
                  console.log(`  ✓ Found exported route: ${path}`);
                }
              }
            }
          }
        }
      }

      // Check for default exports
      const exportDefaultMatch = code.match(patterns.exportDefault);
      if (exportDefaultMatch) {
        console.log(`  Found default export: ${exportDefaultMatch[0]}`);
        for (const match of exportDefaultMatch) {
          const routeArray = match.match(/\[([\s\S]*?)\]/)?.[1];
          if (routeArray) {
            console.log(`  Processing default exported route array: ${routeArray}`);
            const routeObjects = routeArray.match(patterns.routeObjectPath);
            if (routeObjects) {
              for (const obj of routeObjects) {
                const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                if (pathMatch?.[1]) {
                  const path = pathMatch[1].trim();
                  const tags = extractTags(code, obj);
                  const children = extractChildren(routeArray, obj);
                  routes.set(path, { path, tags, children });
                  console.log(`  ✓ Found default exported route: ${path}`);
                }
              }
            }
          }
        }
      }

      // Then check for imported routes
      console.log(`  Checking for imported routes in ${file}`);
      
      // Check for named imports
      const importNamedMatches = code.match(patterns.importNamed);
      if (importNamedMatches) {
        console.log(`  Found named imports: ${importNamedMatches.length}`);
        for (const match of importNamedMatches) {
          const importPath = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (importPath) {
            console.log(`  Processing import from: ${importPath}`);
            const importedFilePath = resolveImportPath(file, importPath);
            if (importedFilePath) {
              try {
                const importedCode = fs.readFileSync(importedFilePath, 'utf8');
                // Look for exported routes in the imported file
                const exportedRoutes = importedCode.match(patterns.exportConst);
                if (exportedRoutes) {
                  for (const exportedRoute of exportedRoutes) {
                    const routeArray = exportedRoute.match(/\[([\s\S]*?)\]/)?.[1];
                    if (routeArray) {
                      const routeObjects = routeArray.match(patterns.routeObjectPath);
                      if (routeObjects) {
                        for (const obj of routeObjects) {
                          const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                          if (pathMatch?.[1]) {
                            const path = pathMatch[1].trim();
                            const tags = extractTags(importedCode, obj);
                            const children = extractChildren(routeArray, obj);
                            routes.set(path, { path, tags, children });
                            console.log(`  ✓ Found imported route: ${path}`);
                          }
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`  ❌ Error reading imported file ${importedFilePath}:`, error);
              }
            }
          }
        }
      }

      // Check for default imports
      const importDefaultMatches = code.match(patterns.importDefault);
      if (importDefaultMatches) {
        console.log(`  Found default imports: ${importDefaultMatches.length}`);
        for (const match of importDefaultMatches) {
          const importPath = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (importPath) {
            console.log(`  Processing default import from: ${importPath}`);
            const importedFilePath = resolveImportPath(file, importPath);
            if (importedFilePath) {
              try {
                const importedCode = fs.readFileSync(importedFilePath, 'utf8');
                // Look for default exported routes in the imported file
                const exportedRoutes = importedCode.match(patterns.exportDefault);
                if (exportedRoutes) {
                  for (const exportedRoute of exportedRoutes) {
                    const routeArray = exportedRoute.match(/\[([\s\S]*?)\]/)?.[1];
                    if (routeArray) {
                      const routeObjects = routeArray.match(patterns.routeObjectPath);
                      if (routeObjects) {
                        for (const obj of routeObjects) {
                          const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                          if (pathMatch?.[1]) {
                            const path = pathMatch[1].trim();
                            const tags = extractTags(importedCode, obj);
                            const children = extractChildren(routeArray, obj);
                            routes.set(path, { path, tags, children });
                            console.log(`  ✓ Found default imported route: ${path}`);
                          }
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`  ❌ Error reading imported file ${importedFilePath}:`, error);
              }
            }
          }
        }
      }

      // Scan for Route components
      const routeMatches = code.match(patterns.routeComponent);
      if (routeMatches) {
        console.log(`  Found ${routeMatches.length} Route components`);
        for (const match of routeMatches) {
          console.log(`  Checking route match: ${match}`);
          const pathMatch = match.match(patterns.pathProp);
          if (pathMatch?.[1]) {
            const path = pathMatch[1].trim();
            const elementMatch = match.match(patterns.elementProp);
            const component = elementMatch?.[1]?.trim();
            const tags = extractTags(code, match);
            routes.set(path, { path, component, tags });
            console.log(`  ✓ Found route: ${path} (component: ${component})`);
          } else {
            console.log(`  ⚠️  Route match found but no path: ${match}`);
          }
        }
      }

      // Scan for route constants
      const constMatches = code.match(patterns.routeConst);
      if (constMatches) {
        console.log(`  Found ${constMatches.length} route constants`);
        for (const match of constMatches) {
          if (!match) {
            console.log(`  ⚠️  Empty match found`);
            continue;
          }
          console.log(`  Checking constant match: ${match}`);
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
                  console.log(`  ✓ Found route: ${path}`);
                } else {
                  console.log(`  ⚠️  Route object found but no path: ${objMatch}`);
                }
              }
            } else {
              console.log(`  ⚠️  No route objects found in array: ${routeArray}`);
            }
          } else {
            console.log(`  ⚠️  No route array found in match: ${match}`);
          }
        }
      }

      // Scan for React Router v6 RouteObject patterns first
      console.log(`  Checking for React Router v6 patterns in ${file}`);
      
      // Look for RouteObject type imports
      const hasRouteObjectImport = code.includes('RouteObject');
      if (hasRouteObjectImport) {
        console.log(`  Found RouteObject import`);
      }
      
      // Look for route definitions
      const routeObjectArrayMatch = code.match(patterns.routeObjectArray);
      const routeObjectConstMatch = code.match(patterns.routeObjectConst);
      
      if (routeObjectArrayMatch) {
        console.log(`  Found RouteObject array definition with type`);
        console.log(`  Match: ${routeObjectArrayMatch[0]}`);
      }
      
      if (routeObjectConstMatch) {
        console.log(`  Found RouteObject constant definition`);
        console.log(`  Match: ${routeObjectConstMatch[0]}`);
      }
      
      const routeObjectMatches = routeObjectArrayMatch || routeObjectConstMatch;
      if (routeObjectMatches) {
        console.log(`  Found ${routeObjectMatches.length} RouteObject definitions`);
        for (const match of routeObjectMatches) {
          if (!match) {
            console.log(`  ⚠️  Empty match found`);
            continue;
          }
          console.log(`  Checking RouteObject match: ${match}`);
          const routeArray = match[2];
          if (routeArray) {
            console.log(`  Route array content: ${routeArray}`);
            // Extract routes from the array
            const routeObjects = routeArray.match(patterns.routeObjectPath);
            if (routeObjects) {
              console.log(`  Found ${routeObjects.length} route objects`);
              for (const obj of routeObjects) {
                console.log(`  Checking route object: ${obj}`);
                const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
                if (pathMatch?.[1]) {
                  const path = pathMatch[1].trim();
                  const tags = extractTags(code, obj);
                  const children = extractChildren(routeArray, obj);
                  routes.set(path, { path, tags, children });
                  console.log(`  ✓ Found route: ${path}`);
                } else {
                  console.log(`  ⚠️  Route object found but no path: ${obj}`);
                }
              }
            } else {
              console.log(`  ⚠️  No route objects found in RouteObject array: ${routeArray}`);
            }
          } else {
            console.log(`  ⚠️  No route array found in RouteObject match: ${match}`);
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
          console.log(`  Found ${providerMatches.length} router providers`);
          for (const match of providerMatches) {
            if (!match) {
              console.log(`  ⚠️  Empty provider match found`);
              continue;
            }
            console.log(`  Checking provider match: ${match}`);
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
                  console.log(`  Found router creation: ${routerPattern}`);
                  const routesVarMatch = routerMatch[1].match(/\b(\w+)\b/);
                  if (routesVarMatch) {
                    const routesVar = routesVarMatch[1];
                    console.log(`  Looking for routes variable: ${routesVar}`);
                    
                    // First try to find routes in the same file
                    const routeDefRegex = new RegExp(`(?:const|let|var)\\s+${routesVar}\\s*=\\s*\\[(([\\s\\S])*?)\\]`);
                    const routeDef = code.match(routeDefRegex);
                    
                    if (routeDef?.[1]) {
                      console.log(`  Found routes definition in same file`);
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
                            console.log(`  ✓ Found route: ${path}`);
                          } else {
                            console.log(`  ⚠️  Route object found but no path: ${obj}`);
                          }
                        }
                      } else {
                        console.log(`  ⚠️  No route objects found in definition: ${routeDef[1]}`);
                      }
                    } else {
                      console.log(`  ⚠️  No routes definition found for variable: ${routesVar}`);
                      // Look for imported routes
                      const importMatches = code.match(patterns.importRoutes);
                      if (importMatches) {
                        console.log(`  Looking for imported routes`);
                        for (const importMatch of importMatches) {
                          if (!importMatch) continue;
                          const importPath = importMatch.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                          if (importPath) {
                            console.log(`  Found import: ${importPath}`);
                            // Try to resolve the imported file
                            const importedFilePath = resolveImportPath(file, importPath);
                            if (importedFilePath) {
                              try {
                                console.log(`  Reading imported file: ${importedFilePath}`);
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
                                        console.log(`  ✓ Found route: ${path}`);
                                      } else {
                                        console.log(`  ⚠️  Imported route object found but no path: ${obj}`);
                                      }
                                    }
                                  } else {
                                    console.log(`  ⚠️  No route objects found in imported definition: ${importedRouteDef[2]}`);
                                  }
                                } else {
                                  console.log(`  ⚠️  No route definition found in imported file: ${importedFilePath}`);
                                }
                              } catch (error) {
                                console.error(`  ❌ Error reading imported file ${importedFilePath}:`, error);
                              }
                            } else {
                              console.log(`  ⚠️  Could not resolve import path: ${importPath}`);
                            }
                          }
                        }
                      } else {
                        console.log(`  ⚠️  No imports found in file`);
                      }
                    }
                  } else {
                    console.log(`  ⚠️  No routes variable found in router match: ${routerMatch[1]}`);
                  }
                }
              }
            } else {
              console.log(`  ⚠️  No router content found in provider match: ${match}`);
            }
          }
        }
      }

      // Scan for routes.tsx pattern
      if (file.endsWith('routes.tsx')) {
        console.log(`  Found routes.tsx file`);
        // Look for simple routes constant without type
        const simpleRoutesMatch = code.match(patterns.routeObjectConst);
        if (simpleRoutesMatch) {
          console.log(`  Found ${simpleRoutesMatch.length} simple route matches`);
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
                  console.log(`  ✓ Found route: ${path}`);
                } else {
                  console.log(`  ⚠️  Route object found but no path: ${obj}`);
                }
              }
            } else {
              console.log(`  ⚠️  No route objects found in simple match: ${match}`);
            }
          }
        }

        // Existing RoutesObject type scanning
        const typeMatch = code.match(patterns.routesObjectType);
        if (typeMatch) {
          console.log(`  Found RoutesObject type definition`);
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
                  console.log(`  ✓ Found route: ${path}`);
                } else {
                  console.log(`  ⚠️  Route object found but no path: ${obj}`);
                }
              }
            } else {
              console.log(`  ⚠️  No route objects found in type definition: ${routesArray}`);
            }
          } else {
            console.log(`  ⚠️  No routes constant found with RoutesObject type`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning file ${file}:`, error);
    }
  }

  console.log(`\n✅ Scan complete. Found ${routes.size} routes:`);
  routes.forEach((route, path) => {
    console.log(`  • ${path}${route.component ? ` (component: ${route.component})` : ''}${route.tags?.length ? ` [tags: ${route.tags.join(', ')}]` : ''}`);
  });
  
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