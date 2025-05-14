/* eslint-disable no-useless-escape */
import fs from "fs";
import { Route } from "./index";
import { patterns } from "./patterns";
import { resolveImportPath } from "./fileUtils";
import { extractTags, extractChildren } from "./extractorUtils";

export function parseExportedRoutes(code: string, file: string, routes: Map<string, Route>): void {
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
}

export function parseImportedRoutes(code: string, file: string, routes: Map<string, Route>): void {
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
}

export function parseRouteComponents(code: string, routes: Map<string, Route>): void {
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
}

export function parseRouteConstants(code: string, routes: Map<string, Route>): void {
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
}

export function parseRouteObjectPatterns(code: string, routes: Map<string, Route>): void {
  const hasRouteObjectImport = code.includes('RouteObject');
  if (hasRouteObjectImport) {
    console.log(`  Found RouteObject import`);
  }
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
      const routeArray = match[2]; // This is match[2] for routeObjectArray and routeObjectConst
      if (routeArray) {
        console.log(`  Route array content: ${routeArray}`);
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
}

export function parseRoutesFile(code: string, file: string, routes: Map<string, Route>): void {
  if (file.endsWith('routes.tsx')) {
    console.log(`  Found routes.tsx file`);
    // Look for simple routes constant without type
    const simpleRoutesMatch = code.match(patterns.routeObjectConst);
    if (simpleRoutesMatch) {
      console.log(`  Found ${simpleRoutesMatch.length} simple route matches`);
      for (const match of simpleRoutesMatch) {
        // Ensure match is treated as a string for .match method
        const currentMatchString = typeof match === 'string' ? match : (match && match[0]);
        if (!currentMatchString) continue;

        const routeObjects = currentMatchString.match(patterns.routeObject);
        if (routeObjects) {
          for (const obj of routeObjects) {
            const pathMatch = obj.match(/path\s*:\s*["'](.*?)["']/);
            if (pathMatch?.[1]) {
              const path = pathMatch[1].trim();
              const tags = extractTags(code, obj);
              // For simple routes match, the entire match is the context for children
              const children = extractChildren(currentMatchString, obj);
              routes.set(path, { path, tags, children });
              console.log(`  ✓ Found route: ${path}`);
            } else {
              console.log(`  ⚠️  Route object found but no path: ${obj}`);
            }
          }
        } else {
          console.log(`  ⚠️  No route objects found in simple match: ${currentMatchString}`);
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
}

export function parseRouterProviders(code: string, file: string, routes: Map<string, Route>): void {
    const routerProviders = [patterns.routerProvider, patterns.routingProvider];
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
                    const routerCreationPatterns = [
                        patterns.createHashRouter,
                        patterns.createBrowserRouter,
                        patterns.createMemoryRouter,
                        patterns.createRoutesFromElements,
                    ];
                    for (const routerPattern of routerCreationPatterns) {
                        const routerMatch = routerContent.match(routerPattern);
                        if (routerMatch) {
                            console.log(`  Found router creation: ${routerPattern}`);
                            const routesVarMatch = routerMatch[1].match(/\b(\w+)\b/);
                            if (routesVarMatch) {
                                const routesVar = routesVarMatch[1];
                                console.log(`  Looking for routes variable: ${routesVar}`);
                                const routeDefRegex = new RegExp(`(?:const|let|var)\s+${routesVar}\s*=\s*\[(([s\S]*?)\]`);
                                const routeDef = code.match(routeDefRegex);
                                if (routeDef?.[1]) {
                                    console.log(`  Found routes definition in same file`);
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
                                    const importMatches = code.match(patterns.importRoutes);
                                    if (importMatches) {
                                        console.log(`  Looking for imported routes`);
                                        for (const importMatch of importMatches) {
                                            if (!importMatch) continue;
                                            const importPath = importMatch.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                                            if (importPath) {
                                                console.log(`  Found import: ${importPath}`);
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
} 