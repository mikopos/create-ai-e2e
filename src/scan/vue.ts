// src/scan/vue.ts
import {parse as parseSFC} from "@vue/compiler-sfc";
import fs from "fs";
import { sync as globSync } from "glob";
import {parse} from "@babel/parser";
import traverse from "@babel/traverse";

export async function scanVue(rootDir: string): Promise<string[]> {
  const vueFiles = globSync("**/*.vue", {cwd: rootDir, absolute: true});
  const routerFiles = globSync("router/**/*.{js,ts}", {
    cwd: rootDir,
    absolute: true,
  });

  const routes = new Set<string>();

  for (const file of vueFiles) {
    const content = fs.readFileSync(file, "utf8");
    const {descriptor} = parseSFC(content);
    if (!descriptor.template) continue;

    const matches = descriptor.template.content.matchAll(
        /<router-link\s+[^>]*to\s*=\s*["']([^"']+)["']/g
    );
    for (const m of matches) {
      routes.add(m[1]);
    }
  }

  for (const file of routerFiles) {
    const code = fs.readFileSync(file, "utf8");
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      ObjectProperty(propPath) {
        const key = propPath.node.key;
        if (
            (key.type === "Identifier" && key.name === "path") ||
            (key.type === "StringLiteral" && key.value === "path")
        ) {
          const val = propPath.node.value;
          if (val.type === "StringLiteral") {
            routes.add(val.value);
          }
        }
      },
    });
  }

  // 3) Filter out empties and return
  return Array.from(routes).filter((p) => p && !p.startsWith(":"));
}
