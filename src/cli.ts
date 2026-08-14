#!/usr/bin/env node
import { ConfigError } from "./config/validate.js";
import { createHub } from "./commands/create-hub.js";

const args = process.argv.slice(2);

function flag(name: string): boolean {
  return args.includes(name);
}

function option(name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function printHelp(): void {
  console.log(`Learning Platform CLI

Usage:
  lp create hub
  lp create hub --config hub.json
  lp create hub --config hub.json --out ./unit-99-example --force

Options:
  --config <file>          Non-interactive JSON config
  --out <dir>              Output directory
  --workspace-root <dir>   Parent directory that contains core/ui(/content)
  --force                  Overwrite generated files in a non-empty directory
  --skip-install           Skip npm install/typecheck/test after generation
  --help                   Show this help
`);
}

async function main(): Promise<void> {
  if (args.length === 0 || flag("--help") || args[0] === "help") {
    printHelp();
    return;
  }
  if (args[0] === "create" && args[1] === "hub") {
    const result = await createHub({
      configPath: option("--config"),
      outputDir: option("--out"),
      workspaceRoot: option("--workspace-root"),
      force: flag("--force"),
      skipInstall: flag("--skip-install")
    });
    console.log(`Created hub at ${result.outputDir} (${result.written.length} files).`);
    return;
  }
  printHelp();
  process.exitCode = 2;
}

main().catch((error) => {
  if (error instanceof ConfigError) {
    for (const item of error.diagnostics) {
      console.error(`${item.code} ${item.path}: ${item.message}`);
    }
    process.exitCode = 1;
    return;
  }
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
