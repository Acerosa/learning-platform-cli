import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ResolvedHubConfig } from "./config.js";
import { packageRoot } from "../../../shared/package-root.js";
import { resolveInside } from "../../../shared/paths.js";
import {
  appConfig,
  globalsSource,
  hubCss,
  hubManifest,
  htmlPage,
  mainSource,
  modulesDts,
  pathsSource,
  pageContextSource,
  platformSource,
  provenance,
  supabaseConfig,
  themeBootstrapSource,
  useHubPlatformSource
} from "./files/app-files.js";
import { githubProtectionDoc, githubWorkflow } from "./files/ci.js";
import { contentFiles } from "./files/content.js";
import { gitignore, packageJson, tsconfigJson, viteConfig, vitestConfig } from "./files/package-files.js";
import { appSource, pageCopySource, pagesSource } from "./files/pages.js";
import { hubReadme } from "./files/readme.js";
import { hubRoutes } from "./files/routes.js";
import { generatedTests } from "./files/tests.js";

export type FileMap = Record<string, string>;

export function buildHubFiles(config: ResolvedHubConfig): FileMap {
  const files: FileMap = {
    "package.json": packageJson(config),
    "tsconfig.json": tsconfigJson(),
    "vitest.config.ts": vitestConfig(),
    "vite.config.ts": viteConfig(config),
    ".gitignore": gitignore(),
    "README.md": hubReadme(config),
    "learning-platform-hub.json": hubManifest(config),
    "docs/provenance.json": provenance(config),
    "docs/github-protection.md": githubProtectionDoc(),
    ".github/workflows/pages.yml": githubWorkflow(config),
    "css/hub.css": hubCss(),
    "src/main.tsx": mainSource(),
    "src/App.tsx": appSource(config),
    "src/config.ts": appConfig(config),
    "src/platform.ts": platformSource(),
    "src/paths.ts": pathsSource(),
    "src/page-context.ts": pageContextSource(config),
    "src/page-copy.ts": pageCopySource(config),
    "src/globals.ts": globalsSource(),
    "src/theme-bootstrap.ts": themeBootstrapSource(),
    "src/supabase-config.ts": supabaseConfig(config),
    "src/hooks/useHubPlatform.ts": useHubPlatformSource(),
    "src/pages/HubPages.tsx": pagesSource(config),
    "src/types/modules.d.ts": modulesDts(),
    ...generatedTests(config),
    ...contentFiles(config)
  };

  for (const route of hubRoutes(config)) {
    files[route.file] = htmlPage(config, route);
  }

  return files;
}

export async function writeHubFiles(
  config: ResolvedHubConfig,
  files: FileMap,
  options: { force?: boolean } = {}
): Promise<{ written: string[]; skippedExisting: string[] }> {
  const dest = config.outputDir;
  const exists = await pathExists(dest);
  if (exists) {
    const entries = await readdir(dest);
    const meaningful = entries.filter((name) => name !== "." && name !== "..");
    if (meaningful.length && !options.force) {
      throw new Error(`LP_TARGET_EXISTS: ${dest} is not empty. Pass --force to overwrite generated files without deleting extra files.`);
    }
  } else {
    await mkdir(dest, { recursive: true });
  }

  const written: string[] = [];
  for (const [relativePath, contents] of Object.entries(files)) {
    const full = resolveInside(dest, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, contents, "utf8");
    written.push(relativePath);
  }

  const schemaSource = resolveInside(packageRoot(), "schemas/learning-platform-hub.schema.json");
  if (await pathExists(schemaSource)) {
    const schema = await readFile(schemaSource, "utf8");
    const schemaDest = resolveInside(dest, "schemas/learning-platform-hub.schema.json");
    await mkdir(dirname(schemaDest), { recursive: true });
    await writeFile(schemaDest, schema, "utf8");
    written.push("schemas/learning-platform-hub.schema.json");
  }

  return { written, skippedExisting: [] };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
