#!/usr/bin/env node
import { ConfigError } from "./commands/create/hub/validate.js";
import { createHub } from "./commands/create/hub/command.js";
import { hasFlag, optionValue } from "./shared/args.js";

const args = process.argv.slice(2);

function printHelp(): void {
  console.log(`Learning Platform CLI

Current command:
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

This repository is platform developer tooling. It is not a hub-spawner-only package.
`);
}

async function main(): Promise<void> {
  if (args.length === 0 || hasFlag(args, "--help") || args[0] === "help") {
    printHelp();
    return;
  }
  if (args[0] === "create" && args[1] === "hub") {
    const result = await createHub({
      configPath: optionValue(args, "--config"),
      outputDir: optionValue(args, "--out"),
      workspaceRoot: optionValue(args, "--workspace-root"),
      force: hasFlag(args, "--force"),
      skipInstall: hasFlag(args, "--skip-install")
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
