import { relative, resolve } from "node:path";
import { PACKAGE_BASELINE } from "../../../../shared/baselines.js";
import type { ResolvedHubConfig } from "../config.js";

export function posixRelative(from: string, to: string): string {
  const value = relative(from, to).split("\\").join("/");
  return value.startsWith(".") ? value : `./${value}`;
}

export function fileDependency(config: ResolvedHubConfig, directory: string): string {
  return `file:${posixRelative(config.outputDir, resolve(config.workspaceRoot, directory))}`;
}

export function packageJson(config: ResolvedHubConfig): string {
  const dependencies: Record<string, string> = {
    "@learning-platform/core": fileDependency(config, PACKAGE_BASELINE.core.directory),
    "@learning-platform/ui": fileDependency(config, PACKAGE_BASELINE.ui.directory),
    "@supabase/supabase-js": PACKAGE_BASELINE.supabaseJs,
    react: PACKAGE_BASELINE.react,
    "react-dom": PACKAGE_BASELINE.reactDom
  };
  if (config.useContentEngine) {
    dependencies["@learning-platform/content"] = fileDependency(config, PACKAGE_BASELINE.content.directory);
  }

  return `${JSON.stringify({
    name: config.packageName,
    version: config.version,
    private: true,
    engines: { node: ">=20" },
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      typecheck: "tsc --noEmit",
      test: "npm run test:node && npm run test:app && npm run build && node --test test/post-build/build.test.js",
      "test:node": "node --test test/*.test.js",
      "test:app": "vitest run",
      check: "npm run typecheck && npm test"
    },
    dependencies,
    devDependencies: {
      "@testing-library/jest-dom": PACKAGE_BASELINE.testingLibraryJestDom,
      "@testing-library/react": PACKAGE_BASELINE.testingLibraryReact,
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      "@vitejs/plugin-react": PACKAGE_BASELINE.pluginReact,
      jsdom: "^26.1.0",
      typescript: PACKAGE_BASELINE.typescript,
      vite: PACKAGE_BASELINE.vite,
      vitest: PACKAGE_BASELINE.vitest
    }
  }, null, 2)}\n`;
}

export function tsconfigJson(): string {
  return `${JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      isolatedModules: true,
      esModuleInterop: true,
      types: ["vite/client"]
    },
    include: ["src"]
  }, null, 2)}\n`;
}

export function vitestConfig(): string {
  return `import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"]
  }
});
`;
}

export function viteConfig(config: ResolvedHubConfig): string {
  const copyContent = config.useContentEngine
    ? `      cpSync(resolve(${JSON.stringify(`content/${config.hubId}`)}), resolve(dist, ${JSON.stringify(`content/${config.hubId}`)}), { recursive: true });\n`
    : "";
  return `import react from "@vitejs/plugin-react";
import { cpSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";

function collectHtml(directory: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules" || entry === "dist" || entry === "test" || entry === "tests") continue;
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) collectHtml(full, acc);
    else if (entry === "index.html") acc.push(full);
  }
  return acc;
}

function htmlInputs() {
  return Object.fromEntries(
    collectHtml(process.cwd()).map((file) => {
      const relative = file.replace(process.cwd() + "/", "");
      const name = relative === "index.html" ? "home" : relative.replace(/\\/index\\.html$/, "").replaceAll("/", "-");
      return [name, file];
    })
  );
}

function pagesAssets() {
  return {
    name: "learning-platform-pages-assets",
    closeBundle() {
      const dist = resolve("dist");
${copyContent}      writeFileSync(resolve(dist, ".nojekyll"), "");
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), pagesAssets()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: htmlInputs()
    }
  }
});
`;
}

export function gitignore(): string {
  return `node_modules/
dist/
.DS_Store
`;
}
