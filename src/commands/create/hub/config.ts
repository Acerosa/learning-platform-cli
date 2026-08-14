import { CONTEXT_TYPES, PROFILES } from "../../../shared/baselines.js";

export type HubProfile = (typeof PROFILES)[number];
export type ContextType = (typeof CONTEXT_TYPES)[number];

export type HubCreateConfig = {
  hubId: string;
  displayName: string;
  description?: string;
  repositoryName?: string;
  version?: string;
  courseKey: string;
  profile: HubProfile;
  contextType?: ContextType;
  useContentEngine: boolean;
  branding?: {
    primary?: string;
    accent?: string;
  };
  shortName?: string;
  qualification?: string;
  githubOwner?: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  supabase?: {
    projectUrl?: string;
    publishableKey?: string;
  };
  outputDir?: string;
  workspaceRoot?: string;
  coreVersion?: string;
  uiVersion?: string;
  contentVersion?: string;
  learnerApiContractVersion?: string;
  submissionContractVersion?: string;
};

export type Diagnostic = {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type ResolvedHubConfig = {
  hubId: string;
  displayName: string;
  description: string;
  repositoryName: string;
  version: string;
  courseKey: string;
  profile: HubProfile;
  contextType: ContextType;
  useContentEngine: boolean;
  branding: { primary: string; accent: string };
  shortName: string;
  qualification: string;
  githubOwner: string;
  repositoryUrl: string;
  deploymentUrl: string;
  supabase: { projectUrl: string; publishableKey: string };
  outputDir: string;
  workspaceRoot: string;
  coreVersion: string;
  uiVersion: string;
  contentVersion: string;
  learnerApiContractVersion: string;
  submissionContractVersion: string;
  packageName: string;
  warnings: Diagnostic[];
};
