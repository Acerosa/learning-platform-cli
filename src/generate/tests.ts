import type { ResolvedHubConfig } from "../config/types.js";
import { hubRoutes, navigationRoutes } from "./routes.js";

export function generatedTests(config: ResolvedHubConfig): Record<string, string> {
  const routes = hubRoutes(config);
  const nav = navigationRoutes(config);
  return {
    "test/fixtures/route-inventory.json": `${JSON.stringify({
      hubId: config.hubId,
      profile: config.profile,
      routes: routes.map((route) => ({ id: route.id, file: route.file, path: route.path }))
    }, null, 2)}\n`,
    "src/presentation.test.tsx": presentationTest(config, nav),
    "test/site-integrity.test.js": siteIntegrityTest(routes),
    "test/manifest.test.js": manifestTest(config),
    "test/secrets.test.js": secretsTest(),
    "test/post-build/build.test.js": postBuildTest(routes)
  };
}

function presentationTest(config: ResolvedHubConfig, nav: ReturnType<typeof navigationRoutes>): string {
  const expectedLabels = nav.map((item) => item.label);
  return `import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HubShell } from "@learning-platform/ui";
import { APP_CONFIG } from "./config";
import { HomePage } from "./pages/HubPages";
import { breadcrumbs } from "./page-copy";
import { navigationItems } from "./paths";

describe("${config.hubId} presentation", () => {
  it("renders the hub shell, home copy and navigation labels", () => {
    render(
      <HubShell
        brandTitle={APP_CONFIG.shortName}
        brandTagline={APP_CONFIG.qualification}
        navigation={navigationItems([...APP_CONFIG.navigation], ".")}
        currentId="home"
        pageHeader={{ title: APP_CONFIG.siteName }}
        footer={{ lines: [APP_CONFIG.siteName] }}
      >
        <HomePage root="." />
      </HubShell>
    );
    expect(screen.getByRole("heading", { name: "Welcome" })).toBeTruthy();
    expect(document.querySelector(".lp-skip-link")?.getAttribute("href")).toBe("#main-content");
${expectedLabels.map((label) => `    expect(screen.getByRole("link", { name: ${JSON.stringify(label)} })).toBeTruthy();`).join("\n")}
  });

  it("uses hub branding tokens and learner-facing theme colours", () => {
    expect(APP_CONFIG.theme.primary).toBe(${JSON.stringify(config.branding.primary)});
    expect(APP_CONFIG.theme.accent).toBe(${JSON.stringify(config.branding.accent)});
  });

  it("builds breadcrumbs without inventing curriculum titles", () => {
    const items = breadcrumbs({ page: "resources", section: "resources", root: ".." });
    expect(items.map((item) => item.label)).toEqual(["Home", "Resources"]);
  });
});
`;
}

function siteIntegrityTest(routes: ReturnType<typeof hubRoutes>): string {
  const files = routes.map((route) => route.file);
  return `const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const routes = ${JSON.stringify(files, null, 2)};

test("all GitHub Pages scaffold routes exist", function () {
  routes.forEach(function (route) {
    assert.equal(fs.existsSync(path.join(root, route)), true, "missing route " + route);
  });
});

test("routes are Vite HTML shells with relative module entries", function () {
  routes.forEach(function (route) {
    const html = fs.readFileSync(path.join(root, route), "utf8");
    assert.match(html, /lang="en-GB"/);
    assert.match(html, /id="root"/);
    assert.match(html, /type="module"/);
    assert.match(html, /src=".*src\\/main\\.tsx"/);
    assert.match(html, /data-root=/);
    assert.doesNotMatch(html, /#\\//);
  });
});
`;
}

function manifestTest(config: ResolvedHubConfig): string {
  return `const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("hub config matches the canonical manifest", function () {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "learning-platform-hub.json"), "utf8"));
  const config = fs.readFileSync(path.join(root, "src/config.ts"), "utf8");
  const provenance = JSON.parse(fs.readFileSync(path.join(root, "docs/provenance.json"), "utf8"));
  assert.equal(manifest.hubId, ${JSON.stringify(config.hubId)});
  assert.equal(manifest.name, ${JSON.stringify(config.displayName)});
  assert.equal(manifest.courses[0], ${JSON.stringify(config.courseKey)});
  assert.equal(manifest.compatibility.required.coreVersion, ${JSON.stringify(config.coreVersion)});
  assert.match(config, /hubId: ${JSON.stringify(config.hubId)}/);
  assert.equal(manifest.certification.status, "not-certified");
  assert.equal(provenance.packages.ui.version, ${JSON.stringify(config.uiVersion)});
  assert.equal(provenance.useContentEngine, ${config.useContentEngine ? "true" : "false"});
});
`;
}

function secretsTest(): string {
  return `const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const banned = /service_role|SUPABASE_SERVICE|DATABASE_PASSWORD|BEGIN RSA PRIVATE KEY/i;

function walk(directory, acc) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
    if (entry.name === "node_modules" || entry.name === "dist") return;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  });
  return acc;
}

test("the hub does not embed privileged secrets", function () {
  walk(root, []).forEach(function (file) {
    if (path.basename(file) === "secrets.test.js") return;
    if (!/\\.(ts|tsx|js|json|md|yml|html|env)$/i.test(file)) return;
    const text = fs.readFileSync(file, "utf8");
    assert.equal(banned.test(text), false, "privileged secret pattern in " + path.relative(root, file));
  });
});
`;
}

function postBuildTest(routes: ReturnType<typeof hubRoutes>): string {
  const files = routes.map((route) => route.file);
  return `const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const dist = path.resolve(__dirname, "../../dist");
const routes = ${JSON.stringify(files, null, 2)};

test("the Vite production build is a static GitHub Pages site", function () {
  assert.equal(fs.existsSync(path.join(dist, ".nojekyll")), true);
  routes.forEach(function (file) {
    assert.equal(fs.existsSync(path.join(dist, file)), true, file);
  });
  const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  assert.match(home, /type="module"/);
  assert.doesNotMatch(home, /express|next\\/server|Server Actions/i);
  const assets = path.join(dist, "assets");
  const files = fs.readdirSync(assets).filter(function (name) { return name.endsWith(".js"); });
  assert.ok(files.length >= 1);
});
`;
}
