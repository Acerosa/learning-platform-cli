import { readFile } from "node:fs/promises";
import { parseConfigInput, resolveHubConfig } from "../config/validate.js";
import { buildHubFiles, writeHubFiles } from "../generate/hub.js";
import { validateGeneratedHub } from "../generate/validate-output.js";
import { promptHubConfig } from "../prompts.js";
import type { HubCreateConfig } from "../config/types.js";

export type CreateHubOptions = {
  configPath?: string;
  outputDir?: string;
  workspaceRoot?: string;
  force?: boolean;
  skipInstall?: boolean;
  cwd?: string;
};

export async function createHub(options: CreateHubOptions): Promise<{ outputDir: string; written: string[] }> {
  if (!options.configPath && !process.stdin.isTTY) {
    throw new Error("LP_CONFIG_REQUIRED: pass --config <file> or run `lp create hub` in a terminal.");
  }
  const input = options.configPath
    ? parseConfigInput(JSON.parse(await readFile(options.configPath, "utf8")))
    : await promptHubConfig();
  return createHubFromConfig(input, options);
}

export async function createHubFromConfig(
  input: HubCreateConfig,
  options: CreateHubOptions = {}
): Promise<{ outputDir: string; written: string[] }> {
  const config = resolveHubConfig(input, {
    cwd: options.cwd,
    outputDir: options.outputDir,
    workspaceRoot: options.workspaceRoot
  });
  for (const warning of config.warnings) {
    console.warn(`${warning.code} ${warning.path}: ${warning.message}`);
  }
  const files = buildHubFiles(config);
  const { written } = await writeHubFiles(config, files, { force: options.force });
  await validateGeneratedHub(config, { skipInstall: options.skipInstall });
  return { outputDir: config.outputDir, written };
}
