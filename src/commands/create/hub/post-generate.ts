import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_BASELINE } from "../../../shared/baselines.js";
import type { ResolvedHubConfig } from "./config.js";

export async function validateGeneratedHub(
  config: ResolvedHubConfig,
  options: { skipInstall?: boolean } = {}
): Promise<void> {
  assertWorkspacePackages(config);
  if (options.skipInstall) return;
  await run(config.outputDir, "npm", ["install"]);
  await run(config.outputDir, "npm", ["run", "typecheck"]);
  await run(config.outputDir, "npm", ["test"]);
}

function assertWorkspacePackages(config: ResolvedHubConfig): void {
  const required = [PACKAGE_BASELINE.core.directory, PACKAGE_BASELINE.ui.directory];
  if (config.useContentEngine) required.push(PACKAGE_BASELINE.content.directory);
  const missing = required.filter((directory) => !existsSync(join(config.workspaceRoot, directory)));
  if (missing.length) {
    throw new Error(
      `LP_WORKSPACE_PACKAGES_MISSING: expected ${missing.join(", ")} under ${config.workspaceRoot}. Place the hub beside the reviewed platform packages, or pass --workspace-root.`
    );
  }
}

function run(cwd: string, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const child = spawn(command, args, { cwd, stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`LP_POST_GENERATE_FAILED: ${command} ${args.join(" ")} exited ${code}`));
    });
  });
}
