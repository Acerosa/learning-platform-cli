import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CONTEXT_TYPES, DEFAULT_BRANDING, KNOWN_COURSE_KEYS, PROFILES } from "./baselines.js";
import type { HubCreateConfig } from "./config/types.js";

export async function promptHubConfig(): Promise<HubCreateConfig> {
  const rl = createInterface({ input, output });
  const ask = async (question: string, fallback = ""): Promise<string> => {
    const suffix = fallback ? ` [${fallback}]` : "";
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    return answer || fallback;
  };

  try {
    const hubId = await ask("Hub id (kebab-case)");
    const displayName = await ask("Display name");
    const courseKey = await ask("Course key", KNOWN_COURSE_KEYS[0]);
    const profile = await ask(`Profile (${PROFILES.join(" / ")})`, "minimal");
    const contextType = await ask(`Context type (${CONTEXT_TYPES.join(" / ")})`, "none");
    const primary = await ask("Primary colour", DEFAULT_BRANDING.primary);
    const accent = await ask("Accent colour", DEFAULT_BRANDING.accent);
    const content = (await ask("Use content engine? (y/N)", "n")).toLowerCase();
    const outputDir = await ask("Output directory", hubId);
    return {
      hubId,
      displayName,
      courseKey,
      profile: profile as HubCreateConfig["profile"],
      contextType: contextType as HubCreateConfig["contextType"],
      useContentEngine: content === "y" || content === "yes",
      branding: { primary, accent },
      outputDir
    };
  } finally {
    rl.close();
  }
}
