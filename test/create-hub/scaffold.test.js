import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ConfigError, createHubFromConfig, resolveHubConfig, resolveInside } from "../../dist/index.js";

const cliRoot = fileURLToPath(new URL("../..", import.meta.url));
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
    const provenance = JSON.parse(await readFile(join(result.outputDir, "docs/provenance.json"), "utf8"));
    const source = await readFile(join(result.outputDir, "src/platform.ts"), "utf8");
    const home = await readFile(join(result.outputDir, "index.html"), "utf8");

    assert.equal(manifest.hubId, fixture.config.hubId);
    assert.equal(manifest.compatibility.required.coreVersion, "0.2.2");
    assert.equal(manifest.compatibility.required.uiVersion, undefined);
    assert.equal(provenance.generator, "@learning-platform/cli");
    assert.equal(provenance.generatorVersion, "0.1.0");
    assert.equal(provenance.coreVersion, "0.2.2");
    assert.equal(provenance.uiVersion, "0.1.0");
    assert.equal(provenance.contentVersion, fixture.config.useContentEngine ? "0.1.2" : null);
    assert.equal(provenance.packages.core.repository, "Acerosa/learning-platform-core");
    assert.equal(provenance.packages.ui.tag, "v0.1.0");
    assert.match(pkg.dependencies["@learning-platform/core"], /learning-platform-core/);
    assert.match(pkg.dependencies["@learning-platform/ui"], /learning-platform-ui/);
    assert.equal(pkg.learningPlatform.securityBaseline, "1.0");
    assert.match(pkg.scripts["check:hub-security"], /hub-security/);
    if (fixture.config.useContentEngine) {
      assert.match(pkg.scripts["check:learner-bundle"], /check-learner-bundle/);
      assert.match(pkg.scripts.test, /check:learner-bundle/);
      const vite = await readFile(join(result.outputDir, "vite.config.ts"), "utf8");
      assert.match(vite, /learnerSafeContentPlugin/);
      assert.match(vite, /copyLearnerSafeTree/);
      assert.doesNotMatch(vite, /correctOptionId|LEARNER_ANSWER_KEY_FIELDS/);
    } else {
      assert.equal(pkg.scripts["check:learner-bundle"], undefined);
    }
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

test("--force overwrites generated files and keeps extra user files", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "lp-cli-force-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const outputDir = join(parent, "existing");
  await createHubFromConfig({
    hubId: "fixture-force",
    displayName: "Fixture Force",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false
  }, { cwd: parent, outputDir, workspaceRoot, skipInstall: true });

  const extraPath = join(outputDir, "notes", "keep-me.txt");
  await mkdir(join(outputDir, "notes"), { recursive: true });
  await writeFile(join(outputDir, "README.md"), "user-edited-readme\n", "utf8");
  await writeFile(extraPath, "keep this extra file\n", "utf8");

  await createHubFromConfig({
    hubId: "fixture-force",
    displayName: "Fixture Force Updated",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false
  }, { cwd: parent, outputDir, workspaceRoot, skipInstall: true, force: true });

  assert.equal(await readFile(extraPath, "utf8"), "keep this extra file\n");
  assert.match(await readFile(join(outputDir, "README.md"), "utf8"), /Fixture Force Updated/);
  assert.doesNotMatch(await readFile(join(outputDir, "README.md"), "utf8"), /user-edited-readme/);
});

test("generated relative paths cannot escape the destination", () => {
  const dest = resolve(join(tmpdir(), "lp-cli-dest"));
  assert.throws(() => resolveInside(dest, "../outside.txt"), /LP_PATH_ESCAPE/);
  assert.throws(() => resolveInside(dest, "ok/../../outside.txt"), /LP_PATH_ESCAPE/);
  assert.throws(() => resolveInside(dest, "ok/\0secret"), /LP_PATH_ESCAPE/);
  assert.equal(resolveInside(dest, "docs/provenance.json"), join(dest, "docs/provenance.json"));
});

test("rejects path-like repository names", () => {
  assert.throws(() => resolveHubConfig({
    hubId: "unit-99-example",
    displayName: "Example",
    courseKey: "ocr-level-3-it",
    profile: "minimal",
    useContentEngine: false,
    repositoryName: ".."
  }), /LP_INVALID_REPOSITORY_NAME/);
});
