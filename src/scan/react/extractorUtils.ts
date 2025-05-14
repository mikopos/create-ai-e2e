import { Route } from "./index"; // Assuming Route interface is in index.ts

/**
 * Extract tags from comments above a route definition
 */
export function extractTags(code: string, routeMatch: string): string[] {
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
export function extractChildren(routeArray: string, routeMatch: string): Route[] | undefined {
  const children: Route[] = [];
  const childrenMatch = routeMatch.match(/children\s*:\s*\[([\s\S]*?)\]/);

  if (childrenMatch?.[1]) {
    const childrenArray = childrenMatch[1];
    const childObjects = childrenArray.match(/{\s*path\s*:\s*["'](.*?)["']/g);

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