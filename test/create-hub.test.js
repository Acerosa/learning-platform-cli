import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ConfigError, createHubFromConfig, resolveHubConfig } from "../dist/index.js";

const cliRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = dirname(cliRoot);

test("rejects invalid hub ids and unknown profiles", () => {
  assert.throws(() => resolveHubConfig({
    hubId: "Unit 99",
    displayName: "Example",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false
  }), ConfigError);

  assert.throws(() => resolveHubConfig({
    hubId: "unit-99-example",
    displayName: "Example",
    courseKey: "ocr-level-3-it",
    profile: "exam-hub",
    useContentEngine: false
  }), ConfigError);
});

test("rejects privileged supabase keys", () => {
  assert.throws(() => resolveHubConfig({
    hubId: "unit-99-example",
    displayName: "Example",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false,
    supabase: {
      projectUrl: "https://example.supabase.co",
      publishableKey: "service_role_secret"
    }
  }), /LP_PRIVILEGED_KEY/);
});

test("scaffolds minimal, week-based and task-based hubs", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "lp-cli-"));
  t.after(() => rm(parent, { recursive: true, force: true }));

  const cases = [
    {
      name: "minimal",
      config: {
        hubId: "fixture-minimal",
        displayName: "Fixture Minimal",
        courseKey: "ocr-level-3-it",
        profile: "minimal",
        useContentEngine: false,
        branding: { primary: "#123456", accent: "#abcdef" }
      },
      expectFiles: ["index.html", "resources/index.html", "help/index.html", "account/index.html"],
      rejectFiles: ["weeks/index.html", "foundations/index.html", "content/"]
    },
    {
      name: "week-based-content",
      config: {
        hubId: "fixture-weeks",
        displayName: "Fixture Weeks",
        courseKey: "ocr-level-3-it",
        profile: "week-based",
        contextType: "assignment",
        useContentEngine: true,
        branding: { primary: "#1e3a5f", accent: "#2a7a62" }
      },
      expectFiles: [
        "weeks/index.html",
        "weeks/week-1/index.html",
        "assignments/index.html",
        "content/fixture-weeks/index.json",
        "src/content/useContentPackage.ts"
      ],
      rejectFiles: ["foundations/index.html"]
    },
    {
      name: "task-based",
      config: {
        hubId: "fixture-tasks",
        displayName: "Fixture Tasks",
        courseKey: "t-level-digital-software-development",
        profile: "task-based",
        useContentEngine: false,
        branding: { primary: "#006477", accent: "#00839a" }
      },
      expectFiles: ["foundations/index.html", "task-1/index.html"],
      rejectFiles: ["weeks/index.html", "content/"]
    }
  ];

  for (const fixture of cases) {
    const outputDir = join(parent, fixture.name);
    const result = await createHubFromConfig(fixture.config, {
      cwd: parent,
      outputDir,
      workspaceRoot,
      skipInstall: true
    });
    const pkg = JSON.parse(await readFile(join(result.outputDir, "package.json"), "utf8"));
    const manifest = JSON.parse(await readFile(join(result.outputDir, "learning-platform-hub.json"), "utf8"));
    const source = await readFile(join(result.outputDir, "src/platform.ts"), "utf8");
    const home = await readFile(join(result.outputDir, "index.html"), "utf8");

    assert.equal(manifest.hubId, fixture.config.hubId);
    assert.equal(manifest.compatibility.required.coreVersion, "0.2.0");
    assert.match(pkg.dependencies["@learning-platform/core"], /learning-platform-core/);
    assert.match(pkg.dependencies["@learning-platform/ui"], /learning-platform-ui/);
    assert.equal(Boolean(pkg.dependencies["@learning-platform/content"]), fixture.config.useContentEngine);
    assert.match(source, /createClient/);
    assert.doesNotMatch(source, /platform\.client|client,/);
    assert.match(home, /base: "\.\/"|data-root="\."/);
    assert.doesNotMatch(home, /#\//);
    assert.doesNotMatch(await readFile(join(result.outputDir, "src/pages/HubPages.tsx"), "utf8"), /CIA triad|Programming for Business|Northbank/i);

    for (const file of fixture.expectFiles) {
      await readFile(join(result.outputDir, file), "utf8");
    }
    for (const file of fixture.rejectFiles) {
      await assert.rejects(readFile(join(result.outputDir, file), "utf8"));
    }
  }
});

test("does not overwrite a non-empty destination without --force", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "lp-cli-safe-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const outputDir = join(parent, "existing");
  await createHubFromConfig({
    hubId: "fixture-safe",
    displayName: "Fixture Safe",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false
  }, { cwd: parent, outputDir, workspaceRoot, skipInstall: true });

  await assert.rejects(createHubFromConfig({
    hubId: "fixture-safe",
    displayName: "Fixture Safe",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false
  }, { cwd: parent, outputDir, workspaceRoot, skipInstall: true }), /LP_TARGET_EXISTS/);
});
