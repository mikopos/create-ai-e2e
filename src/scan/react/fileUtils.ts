/**
 * Resolve an import path to an absolute file path
 */
export function resolveImportPath(currentFile: string, importPath: string): string | null {
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