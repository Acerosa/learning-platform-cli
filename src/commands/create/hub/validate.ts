import { resolve } from "node:path";
import {
  CONTEXT_TYPES,
  CONTRACT_BASELINE,
  DEFAULT_BRANDING,
  KNOWN_COURSE_KEYS,
  PACKAGE_BASELINE,
  PROFILES,
  SHARED_SUPABASE
} from "../../../shared/baselines.js";
import type { Diagnostic, HubCreateConfig, ResolvedHubConfig } from "./config.js";

const STABLE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const REPO_NAME = /^[A-Za-z0-9._-]+$/;
const HTTPS_URL = /^https:\/\/\S+$/;

export class ConfigError extends Error {
  readonly diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.map((item) => `${item.code} ${item.path}: ${item.message}`).join("\n"));
    this.name = "ConfigError";
    this.diagnostics = diagnostics;
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function add(
  list: Diagnostic[],
  severity: Diagnostic["severity"],
  code: string,
  path: string,
  message: string
): void {
  list.push({ severity, code, path, message });
}

export function parseConfigInput(value: unknown): HubCreateConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError([{
      severity: "error",
      code: "LP_CONFIG_NOT_OBJECT",
      path: "$",
      message: "Hub config must be a JSON object."
    }]);
  }
  return value as HubCreateConfig;
}

export function resolveHubConfig(
  input: HubCreateConfig,
  options: { cwd?: string; outputDir?: string; workspaceRoot?: string } = {}
): ResolvedHubConfig {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  const cwd = options.cwd || process.cwd();

  const hubId = asString(input.hubId);
  if (!STABLE_KEY.test(hubId) || hubId.length > 128) {
    add(errors, "error", "LP_INVALID_HUB_ID", "/hubId", "hubId must be lower-case kebab-case, 1–128 characters.");
  }

  const displayName = asString(input.displayName);
  if (!displayName || displayName.length > 160) {
    add(errors, "error", "LP_INVALID_DISPLAY_NAME", "/displayName", "displayName is required and must be 1–160 characters.");
  }

  const repositoryName = asString(input.repositoryName) || hubId;
  if (repositoryName === "." || repositoryName === ".." || !REPO_NAME.test(repositoryName)) {
    add(errors, "error", "LP_INVALID_REPOSITORY_NAME", "/repositoryName", "repositoryName must be GitHub-safe: letters, numbers, dot, underscore or hyphen, and must not be '.' or '..'.");
  }

  const version = asString(input.version) || "0.1.0";
  if (!SEMVER.test(version)) {
    add(errors, "error", "LP_INVALID_VERSION", "/version", "version must be Semantic Versioning 2.0.0.");
  }

  const courseKey = asString(input.courseKey);
  if (!STABLE_KEY.test(courseKey) || courseKey.length > 128) {
    add(errors, "error", "LP_INVALID_COURSE_KEY", "/courseKey", "courseKey must be lower-case kebab-case, 1–128 characters.");
  } else if (!KNOWN_COURSE_KEYS.includes(courseKey)) {
    add(warnings, "warning", "LP_UNKNOWN_COURSE_KEY", "/courseKey", `courseKey '${courseKey}' is not in the reviewed catalogue (${KNOWN_COURSE_KEYS.join(", ")}). Admin registration will reject unknown courses.`);
  }

  const profile = asString(input.profile);
  if (!PROFILES.includes(profile as typeof PROFILES[number])) {
    add(errors, "error", "LP_UNSUPPORTED_PROFILE", "/profile", `profile must be one of: ${PROFILES.join(", ")}.`);
  }

  const contextType = asString(input.contextType) || "none";
  if (!CONTEXT_TYPES.includes(contextType as typeof CONTEXT_TYPES[number])) {
    add(errors, "error", "LP_UNSUPPORTED_CONTEXT_TYPE", "/contextType", `contextType must be one of: ${CONTEXT_TYPES.join(", ")}.`);
  }

  if (typeof input.useContentEngine !== "boolean") {
    add(errors, "error", "LP_INVALID_CONTENT_FLAG", "/useContentEngine", "useContentEngine must be true or false.");
  }

  const primary = asString(input.branding?.primary) || DEFAULT_BRANDING.primary;
  const accent = asString(input.branding?.accent) || DEFAULT_BRANDING.accent;
  if (!HEX.test(primary)) {
    add(errors, "error", "LP_INVALID_COLOUR", "/branding/primary", "primary must be a 6-digit hex colour such as #123456.");
  }
  if (!HEX.test(accent)) {
    add(errors, "error", "LP_INVALID_COLOUR", "/branding/accent", "accent must be a 6-digit hex colour such as #abcdef.");
  }

  const description = asString(input.description) || `Learner hub for ${displayName || hubId}. Draft scaffold; not a certified production hub.`;
  if (description.length > 1000) {
    add(errors, "error", "LP_INVALID_DESCRIPTION", "/description", "description must be 1–1000 characters.");
  }

  const githubOwner = asString(input.githubOwner) || "Acerosa";
  const repositoryUrl = asString(input.repositoryUrl) || `https://github.com/${githubOwner}/${repositoryName}`;
  const deploymentUrl = asString(input.deploymentUrl) || `https://${githubOwner.toLowerCase()}.github.io/${repositoryName}`;
  for (const [path, url] of [["/repositoryUrl", repositoryUrl], ["/deploymentUrl", deploymentUrl]] as const) {
    if (!HTTPS_URL.test(url) || url.includes("?") || url.includes("#") || url.endsWith("/")) {
      add(errors, "error", "LP_INVALID_URL", path, "URLs must be HTTPS, with no query, fragment or trailing slash.");
    }
  }

  const coreVersion = asString(input.coreVersion) || PACKAGE_BASELINE.core.version;
  const uiVersion = asString(input.uiVersion) || PACKAGE_BASELINE.ui.version;
  const contentVersion = asString(input.contentVersion) || PACKAGE_BASELINE.content.version;
  const learnerApiContractVersion = asString(input.learnerApiContractVersion) || CONTRACT_BASELINE.learnerApiContractVersion;
  const submissionContractVersion = asString(input.submissionContractVersion) || CONTRACT_BASELINE.submissionContractVersion;
  for (const [path, value] of [
    ["/coreVersion", coreVersion],
    ["/uiVersion", uiVersion],
    ["/contentVersion", contentVersion],
    ["/learnerApiContractVersion", learnerApiContractVersion],
    ["/submissionContractVersion", submissionContractVersion]
  ] as const) {
    if (!SEMVER.test(value)) {
      add(errors, "error", "LP_INVALID_VERSION", path, "must be Semantic Versioning 2.0.0.");
    }
  }

  const supabaseUrl = asString(input.supabase?.projectUrl) || SHARED_SUPABASE.projectUrl;
  const publishableKey = asString(input.supabase?.publishableKey) || SHARED_SUPABASE.publishableKey;
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes("supabase.co")) {
    add(errors, "error", "LP_INVALID_SUPABASE_URL", "/supabase/projectUrl", "projectUrl must be a public HTTPS Supabase project URL.");
  }
  if (/service_role/i.test(publishableKey) || /supabase_service/i.test(publishableKey)) {
    add(errors, "error", "LP_PRIVILEGED_KEY", "/supabase/publishableKey", "Do not embed a service-role key. Only the public publishable key is allowed.");
  }
  if (!publishableKey.startsWith("sb_publishable_") && !publishableKey.startsWith("eyJ")) {
    add(warnings, "warning", "LP_UNUSUAL_PUBLISHABLE_KEY", "/supabase/publishableKey", "Expected a Supabase publishable key (sb_publishable_…).");
  }

  if (profile === "minimal" && contextType !== "none" && contextType) {
    add(warnings, "warning", "LP_CONTEXT_ON_MINIMAL", "/contextType", "minimal hubs ignore assignment/exam/project routes; contextType only sets UI flags.");
  }

  const outputDir = resolve(cwd, options.outputDir || input.outputDir || repositoryName);
  const workspaceRoot = resolve(cwd, options.workspaceRoot || input.workspaceRoot || resolve(outputDir, ".."));

  if (errors.length) throw new ConfigError(errors);

  return {
    hubId,
    displayName,
    description,
    repositoryName,
    version,
    courseKey,
    profile: profile as ResolvedHubConfig["profile"],
    contextType: contextType as ResolvedHubConfig["contextType"],
    useContentEngine: Boolean(input.useContentEngine),
    branding: { primary, accent },
    shortName: asString(input.shortName) || displayName.replace(/ Hub$/i, " Hub"),
    qualification: asString(input.qualification) || "Learning Platform",
    githubOwner,
    repositoryUrl,
    deploymentUrl,
    supabase: { projectUrl: supabaseUrl, publishableKey },
    outputDir,
    workspaceRoot,
    coreVersion,
    uiVersion,
    contentVersion,
    learnerApiContractVersion,
    submissionContractVersion,
    packageName: hubId,
    warnings
  };
}
