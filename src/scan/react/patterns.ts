export const patterns = {
    // Route component patterns
    routeComponent: /<\s*Route[^>]*path\s*=\s*["'](.*?)["'][^>]*>/g,
    pathProp: /path\s*=\s*["'](.*?)["']/,
    elementProp: /element\s*=\s*{([^}]+)}/,
    
    // Route array patterns
    routeConst: /(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObject: /{\s*path\s*:\s*["'](.*?)["']/g,
    
    // Router provider patterns
    routingProvider: /<\s*RoutingProvider[^>]*routes\s*=\s*{([^}]+)}[^>]*>/g,
    routerProvider: /<\s*RouterProvider[^>]*router\s*=\s*{([^}]+)}[^>]*>/g,
    
    // Router creation patterns
    createHashRouter: /createHashRouter\(([^)]+)\)/g,
    createBrowserRouter: /createBrowserRouter\(([^)]+)\)/g,
    createMemoryRouter: /createMemoryRouter\(([^)]+)\)/g,
    createRoutesFromElements: /createRoutesFromElements\(([^)]+)\)/g,
    
    // Export patterns
    exportConst: /export\s+(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    exportDefault: /export\s+default\s+\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    exportNamed: /export\s+{\s*(\w+)\s*}/g,
    
    // Import patterns
    importRoutes: /import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    importNamed: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
    importDefault: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    
    // Tag patterns
    routeTags: /\/\/\s*@tags\s*([^\n]+)/g,
    
    // Type patterns
    routesObjectType: /type\s+RoutesObject\s*=\s*\{([^}]+)\}/g,
    routesConst: /(?:const|let|var)\s+(\w+)\s*:\s*RoutesObject\s*\[\s*\]\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    
    // React Router v6 patterns
    routeObjectArray: /(?:const|let|var)\s+(\w+)\s*:\s*RouteObject\s*\[\s*\]\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObjectConst: /(?:const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\](?:\s*;|\s*$)/g,
    routeObjectPath: /{\s*path\s*:\s*["'](.*?)["'][^}]*\}/g,
  }; 