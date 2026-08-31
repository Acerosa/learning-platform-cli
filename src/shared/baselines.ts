export const CLI_VERSION = "0.1.0";

export const PACKAGE_BASELINE = Object.freeze({
  core: {
    name: "@learning-platform/core",
    version: "0.2.2",
    repository: "Acerosa/learning-platform-core",
    tag: "v0.2.2",
    directory: "learning-platform-core"
  },
  ui: {
    name: "@learning-platform/ui",
    version: "0.1.0",
    repository: "Acerosa/Acerosa-learning-platform-ui",
    tag: "v0.1.0",
    directory: "learning-platform-ui"
  },
  content: {
    name: "@learning-platform/content",
    version: "0.1.2",
    repository: "Acerosa/learning-platform-content",
    tag: "v0.1.2",
    directory: "learning-platform-content"
  },
  supabaseJs: "2.112.3",
  react: "19.2.6",
  reactDom: "19.2.6",
  vite: "6.3.5",
  vitest: "3.2.4",
  typescript: "5.9.3",
  pluginReact: "4.5.2",
  testingLibraryReact: "16.3.0",
  testingLibraryJestDom: "6.6.3",
  node: "22"
});

export const CONTRACT_BASELINE = Object.freeze({
  manifestVersion: "1.0.0",
  learnerApiContractVersion: "0.1.0",
  submissionContractVersion: "0.1.0"
});

export const SHARED_SUPABASE = Object.freeze({
  projectUrl: "https://hubwpkrqndorznwzvaer.supabase.co",
  publishableKey: "sb_publishable_SlcVwn-vjm-hTUZlC_UH7g_V3GedixM",
  apiSchema: "api"
});

export const KNOWN_COURSE_KEYS = Object.freeze([
  "ocr-level-3-it",
  "t-level-digital-software-development"
]);

export const PROFILES = Object.freeze(["minimal", "week-based", "task-based"] as const);
export const CONTEXT_TYPES = Object.freeze(["none", "assignment", "exam", "project"] as const);

export const DEFAULT_BRANDING = Object.freeze({
  primary: "#315b7d",
  accent: "#4f7695"
});
