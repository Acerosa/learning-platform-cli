import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";
import { createHubFromConfig } from "../dist/index.js";

const cliRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = dirname(cliRoot);
const fixturesRoot = join(cliRoot, ".tmp/fixtures");

function run(cwd, command, args) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const child = spawn(command, args, { cwd, stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

test("generated fixtures install, test and build", { timeout: 720000 }, async (t) => {
  await rm(fixturesRoot, { recursive: true, force: true });
  await mkdir(fixturesRoot, { recursive: true });
  t.after(async () => {
    await rm(fixturesRoot, { recursive: true, force: true });
  });

  const fixtures = [
    {
      hubId: "fixture-minimal",
      displayName: "Fixture Minimal",
      courseKey: "ocr-level-3-it",
      profile: "minimal",
      useContentEngine: false
    },
    {
      hubId: "fixture-weeks",
      displayName: "Fixture Weeks",
      courseKey: "ocr-level-3-it",
      profile: "week-based",
      contextType: "assignment",
      useContentEngine: true
    },
    {
      hubId: "fixture-tasks",
      displayName: "Fixture Tasks",
      courseKey: "t-level-digital-software-development",
      profile: "task-based",
      useContentEngine: false
    }
  ];

  for (const config of fixtures) {
    const outputDir = join(fixturesRoot, config.hubId);
    await createHubFromConfig(config, {
      cwd: fixturesRoot,
      outputDir,
      workspaceRoot,
      skipInstall: true
    });
    await run(outputDir, "npm", ["install"]);
    await run(outputDir, "npm", ["test"]);
    assert.ok(true, `${config.hubId} built`);
  }
});
