import { CLI_VERSION, CONTRACT_BASELINE, PACKAGE_BASELINE } from "../../../../shared/baselines.js";
import type { ResolvedHubConfig } from "../config.js";
import { contentPackageDir, hubRoutes, navigationRoutes } from "./routes.js";

export function htmlPage(config: ResolvedHubConfig, route: ReturnType<typeof hubRoutes>[number]): string {
  const root = route.depth <= 0 ? "." : Array.from({ length: route.depth }, () => "..").join("/");
  const attrs = [
    `data-page="${route.page}"`,
    `data-section="${route.section}"`,
    `data-root="${root}"`
  ];
  if (route.extraAttrs) {
    for (const [key, value] of Object.entries(route.extraAttrs)) attrs.push(`${key}="${value}"`);
  }
  const extra = route.depth === 0 ? "" : `${"../".repeat(route.depth)}`;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(config.description)}">
  <title>${escapeHtml(config.displayName)}</title>
</head>
<body ${attrs.join(" ")}>
  <noscript><p>Enable JavaScript to use ${escapeHtml(config.displayName)}.</p></noscript>
  <div id="root"></div>
  <script type="module" src="${extra}src/main.tsx"></script>
</body>
</html>
`;
}

export function hubManifest(config: ResolvedHubConfig): string {
  return `${JSON.stringify({
    manifestVersion: CONTRACT_BASELINE.manifestVersion,
    hubId: config.hubId,
    name: config.displayName,
    description: config.description,
    version: config.version,
    repositoryUrl: config.repositoryUrl,
    deploymentUrl: config.deploymentUrl,
    courses: [config.courseKey],
    compatibility: {
      required: {
        coreVersion: config.coreVersion,
        learnerApiContractVersion: config.learnerApiContractVersion,
        submissionContractVersion: config.submissionContractVersion
      },
      testedCombinations: [{
        coreVersion: config.coreVersion,
        learnerApiContractVersion: config.learnerApiContractVersion,
        submissionContractVersion: config.submissionContractVersion
      }]
    },
    capabilities: {
      evidence: ["question-level"],
      activities: ["reflection"]
    },
    featureFlags: {
      authentication: true,
      onboarding: true,
      progress: true
    },
    certification: {
      standard: "LHDS",
      version: "1.0.0",
      status: "not-certified"
    }
  }, null, 2)}\n`;
}

export function provenance(config: ResolvedHubConfig): string {
  return `${JSON.stringify({
    generator: "@learning-platform/cli",
    generatorVersion: CLI_VERSION,
    coreVersion: config.coreVersion,
    uiVersion: config.uiVersion,
    contentVersion: config.useContentEngine ? config.contentVersion : null,
    profile: config.profile,
    contextType: config.contextType,
    useContentEngine: config.useContentEngine,
    packages: {
      core: {
        name: PACKAGE_BASELINE.core.name,
        version: config.coreVersion,
        repository: PACKAGE_BASELINE.core.repository,
        tag: PACKAGE_BASELINE.core.tag
      },
      ui: {
        name: PACKAGE_BASELINE.ui.name,
        version: config.uiVersion,
        repository: PACKAGE_BASELINE.ui.repository,
        tag: PACKAGE_BASELINE.ui.tag
      },
      content: config.useContentEngine
        ? {
          name: PACKAGE_BASELINE.content.name,
          version: config.contentVersion,
          repository: PACKAGE_BASELINE.content.repository,
          tag: PACKAGE_BASELINE.content.tag
        }
        : null
    },
    dependencyStrategy: "file-siblings",
    notes: [
      "UI and Content versions are recorded here because Hub Manifest 1.0.0 cannot hold them.",
      "Register the hub through Admin using learning-platform-hub.json. The CLI does not write to Supabase."
    ]
  }, null, 2)}\n`;
}

export function appConfig(config: ResolvedHubConfig): string {
  const nav = navigationRoutes(config).map((item) => (
    `    Object.freeze({ id: ${JSON.stringify(item.id)}, label: ${JSON.stringify(item.label)}, path: ${JSON.stringify(item.path)} })`
  )).join(",\n");
  const ui = {
    contextType: config.contextType === "none" ? "assignment" : config.contextType,
    showLearningOutcomes: config.profile === "week-based",
    showAssignmentContext: config.contextType === "assignment",
    showExamContext: config.contextType === "exam",
    showProjectContext: config.contextType === "project",
    showIndependentStudy: config.profile === "week-based",
    showProgress: false
  };
  const contentLine = config.useContentEngine
    ? `  curriculumPackage: ${JSON.stringify(contentPackageDir(config))},\n`
    : "";
  return `export const APP_CONFIG = Object.freeze({
  hubId: ${JSON.stringify(config.hubId)},
  hubVersion: ${JSON.stringify(config.version)},
  courseKey: ${JSON.stringify(config.courseKey)},
  siteName: ${JSON.stringify(config.displayName)},
  shortName: ${JSON.stringify(config.shortName)},
  qualification: ${JSON.stringify(config.qualification)},
  coreVersion: ${JSON.stringify(config.coreVersion)},
  learnerApiContractVersion: ${JSON.stringify(config.learnerApiContractVersion)},
  submissionContractVersion: ${JSON.stringify(config.submissionContractVersion)},
  navigation: Object.freeze([
${nav}
  ]),
  features: Object.freeze({
    authentication: true,
    onboarding: true,
    progress: true
  }),
  ui: Object.freeze(${JSON.stringify(ui, null, 4).replace(/\n/g, "\n  ")}),
  theme: Object.freeze({
    primary: ${JSON.stringify(config.branding.primary)},
    accent: ${JSON.stringify(config.branding.accent)}
  }),
${contentLine}  currentPhase: "Scaffold: platform structure only. Curriculum has not been authored."
});

export type AppConfig = typeof APP_CONFIG;
`;
}

export function supabaseConfig(config: ResolvedHubConfig): string {
  return `export const SUPABASE_CONFIG = Object.freeze({
  projectUrl: ${JSON.stringify(config.supabase.projectUrl)},
  publishableKey: ${JSON.stringify(config.supabase.publishableKey)},
  apiSchema: "api"
});
`;
}

export function platformSource(): string {
  return `import { createPlatform } from "@learning-platform/core";
import { createClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "./config";
import { createSitePath } from "./paths";
import { SUPABASE_CONFIG } from "./supabase-config";

export function createHubPlatform(root: string, createPlatformFn = createPlatform) {
  return createPlatformFn({
    hubCode: APP_CONFIG.hubId,
    hubName: APP_CONFIG.siteName,
    platformVersion: APP_CONFIG.coreVersion,
    accountPath: createSitePath(root, "account/"),
    supabase: {
      projectUrl: SUPABASE_CONFIG.projectUrl,
      publishableKey: SUPABASE_CONFIG.publishableKey
    },
    navigation: APP_CONFIG.navigation.map((item) => ({
      ...item,
      path: item.id === "home" ? createSitePath(root) : createSitePath(root, item.path)
    })),
    navigationMode: "as-supplied",
    features: APP_CONFIG.features,
    theme: APP_CONFIG.theme
  }, { createClient });
}

export type HubPlatform = ReturnType<typeof createHubPlatform>;
`;
}

export function pathsSource(): string {
  return `export function createSitePath(root: string, path = ""): string {
  const cleanRoot = root || ".";
  return path ? \`\${cleanRoot}/\${path}\` : \`\${cleanRoot}/\`;
}

export function navigationItems(
  items: Array<{ id: string; label: string; path: string }>,
  root: string
) {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    path: item.id === "home" ? createSitePath(root) : createSitePath(root, item.path)
  }));
}
`;
}

export function pageContextSource(config: ResolvedHubConfig): string {
  return `export type PageContext = {
  page: string;
  section: string;
  root: string;
  week?: string;
  view?: string;
};

export function readPageContext(body: HTMLElement = document.body): PageContext {
  return {
    page: body.dataset.page || "home",
    section: body.dataset.section || body.dataset.page || "home",
    root: body.dataset.root || ".",
    week: body.dataset.lpWeek,
    view: body.dataset.lpView
  };
}

export function currentIds(context: PageContext): string[] {
  return context.page === context.section ? [context.page] : [context.page, context.section];
}

export const PROFILE = ${JSON.stringify(config.profile)} as const;
`;
}

export function globalsSource(): string {
  return `import { APP_CONFIG } from "./config";
import { SUPABASE_CONFIG } from "./supabase-config";

declare global {
  interface Window {
    APP_CONFIG: typeof APP_CONFIG;
    SUPABASE_CONFIG: typeof SUPABASE_CONFIG;
    LearningPlatform?: { platform: unknown; coreVersion: string };
  }
}

window.APP_CONFIG = APP_CONFIG;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
`;
}

export function themeBootstrapSource(): string {
  return `try {
  const stored = window.localStorage.getItem("learning-platform.theme.v1");
  const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const resolved = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-preference", preference);
} catch {
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.setAttribute("data-theme-preference", "system");
}
`;
}

export function useHubPlatformSource(): string {
  return `import { createAccountDialog } from "@learning-platform/core";
import { useEffect, useMemo, useState } from "react";
import type { LearnerSummary, ThemeControl, ThemePreference } from "@learning-platform/ui";
import { APP_CONFIG } from "../config";
import { createHubPlatform } from "../platform";

type AccountDialog = {
  element: HTMLElement;
  open: (trigger?: EventTarget | null) => void;
  destroy?: () => void;
};

export function useHubPlatform(root: string) {
  const platform = useMemo(() => createHubPlatform(root), [root]);
  const [learner, setLearner] = useState<LearnerSummary | null>(null);
  const [theme, setTheme] = useState<ThemeControl | null>(null);
  const [accountDialog, setAccountDialog] = useState<AccountDialog | null>(null);
  const [platformState, setPlatformState] = useState("loading");

  useEffect(() => {
    let dialog: AccountDialog | null = null;
    const unsubscribers: Array<() => void> = [];
    document.body.dataset.platformState = "loading";

    unsubscribers.push(platform.learner.subscribe((state) => {
      setLearner(state.context || null);
    }));
    unsubscribers.push(platform.state.subscribe((snapshot) => {
      setPlatformState(snapshot.status);
      document.body.dataset.platformState = snapshot.status;
    }));
    unsubscribers.push(platform.theme.subscribe((snapshot) => {
      setTheme({
        modes: platform.theme.modes as ThemePreference[],
        preference: snapshot.preference,
        onChange: (mode) => { platform.theme.setPreference(mode); }
      });
    }));

    dialog = createAccountDialog({
      authService: platform.auth,
      learnerContext: platform.learner,
      onboardingService: platform.onboarding
    });
    document.body.appendChild(dialog.element);
    setAccountDialog(dialog);
    window.LearningPlatform = { platform, coreVersion: APP_CONFIG.coreVersion };
    void platform.initialise();

    return () => {
      unsubscribers.forEach((stop) => stop());
      dialog?.element.remove();
      dialog?.destroy?.();
      platform.destroy();
    };
  }, [platform]);

  return { platform, learner, theme, accountDialog, platformState };
}
`;
}

export function mainSource(): string {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@learning-platform/core/theme.css";
import "../css/hub.css";
import "./theme-bootstrap";
import "./globals";
import { App } from "./App";
import { readPageContext } from "./page-context";

const root = document.getElementById("root");
if (!root) throw new Error("LP_ROOT_MISSING");

createRoot(root).render(
  <StrictMode>
    <App context={readPageContext()} />
  </StrictMode>
);
`;
}

export function modulesDts(): string {
  return `declare module "@learning-platform/core" {
  export function createPlatform(options: Record<string, unknown>, dependencies?: Record<string, unknown>): HubPlatform;
  export function createAccountDialog(options: Record<string, unknown>): {
    element: HTMLElement;
    open: (trigger?: EventTarget | null) => void;
    destroy?: () => void;
  };
  export type HubPlatform = {
    config: { hubName: string; accountPath: string };
    auth: { signOut: () => Promise<void>; initialise: () => Promise<unknown> };
    learner: {
      subscribe: (listener: (state: { context?: unknown }) => void) => () => void;
    };
    onboarding: unknown;
    state: { subscribe: (listener: (snapshot: { status: string }) => void) => () => void };
    theme: {
      modes: string[];
      subscribe: (listener: (snapshot: { preference: string }) => void) => () => void;
      setPreference: (mode: string) => void;
    };
    initialise: () => Promise<unknown>;
    destroy: () => void;
  };
}

declare module "@learning-platform/core/theme.css";
declare module "@learning-platform/content";
`;
}

export function hubCss(): string {
  return `*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--lp-font);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--lp-text);
  background: var(--lp-background);
}

:focus-visible {
  outline: 0.2rem solid var(--lp-focus);
  outline-offset: 0.15rem;
}

.student-account {
  display: flex;
  align-items: center;
  gap: var(--lp-space-2);
}

.student-account__name {
  font-weight: 700;
}

.panel {
  padding: var(--lp-space-5);
  border: 0.0625rem solid var(--lp-border);
  border-radius: var(--lp-radius);
  background: var(--lp-surface);
}

.card-grid {
  display: grid;
  gap: var(--lp-space-4);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}

.hub-card {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-2);
  padding: var(--lp-space-5);
  border: 0.0625rem solid var(--lp-border);
  border-radius: var(--lp-radius);
  background: var(--lp-surface);
}

.hub-card h2,
.hub-card h3 {
  margin: 0;
}

.hub-card p {
  margin: 0;
  color: var(--lp-text-muted);
}

.card-link,
.text-link {
  margin-top: auto;
  color: var(--lp-primary);
  font-weight: 700;
}

.site-footer {
  margin-top: auto;
  border-top: 0.0625rem solid var(--lp-border);
  background: var(--lp-surface-alt);
  color: var(--lp-text-muted);
}
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
