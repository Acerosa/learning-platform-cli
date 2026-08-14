import type { ResolvedHubConfig } from "../config.js";
import { contentPackageDir } from "./routes.js";

export function contentFiles(config: ResolvedHubConfig): Record<string, string> {
  if (!config.useContentEngine) return {};
  const dir = contentPackageDir(config);
  const curriculumId = `${config.hubId}-curriculum`;
  const files: Record<string, string> = {
    [`${dir}/index.json`]: json({
      schema: "lp.content.package",
      schemaVersion: "0.1.0",
      id: `${config.hubId}-content`,
      version: config.version,
      metadata: { title: `${config.displayName} content package` },
      relationships: {
        hub: "hub.json",
        curriculum: "curriculum.json",
        learningOutcomes: "learning-outcomes.json",
        assignments: "assignments.json",
        weeks: "weeks.json",
        sessions: "sessions.json",
        activities: "activities.json",
        questions: [],
        assets: []
      }
    }),
    [`${dir}/hub.json`]: json({
      schema: "lp.content.hub",
      schemaVersion: "0.1.0",
      id: config.hubId,
      version: config.version,
      metadata: {
        name: config.displayName,
        description: "Hub presentation pointer. Not the backend registration manifest. Contains no teaching content.",
        branding: config.branding,
        routes: Object.fromEntries(
          [
            ["home", ""],
            ["resources", "resources/"],
            ["help", "help/"],
            ["account", "account/"]
          ].concat(config.profile === "week-based" ? [["weeks", "weeks/"]] : [])
        ),
        features: ["authentication", "onboarding", "progress"]
      },
      relationships: { curriculum: curriculumId }
    }),
    [`${dir}/curriculum.json`]: json({
      schema: "lp.content.curriculum",
      schemaVersion: "0.1.0",
      id: curriculumId,
      version: config.version,
      metadata: {
        title: config.displayName,
        course: config.courseKey,
        qualification: config.qualification,
        planner: { source: null, weekCommencing: null }
      },
      relationships: {
        learningOutcomes: [],
        assignments: [],
        weeks: config.profile === "week-based" ? ["week-1"] : [],
        resources: []
      }
    }),
    [`${dir}/learning-outcomes.json`]: "[]\n",
    [`${dir}/assignments.json`]: "[]\n",
    [`${dir}/sessions.json`]: "[]\n",
    [`${dir}/activities.json`]: "[]\n"
  };

  if (config.profile === "week-based") {
    files[`${dir}/weeks.json`] = json([{
      schema: "lp.content.week",
      schemaVersion: "0.1.0",
      id: "week-1",
      version: "0.1.0",
      metadata: {
        teachingWeek: 1,
        title: "Week 1",
        status: "planned",
        route: "weeks/week-1/",
        weekCommencing: null,
        releaseDate: null,
        dueDate: null
      },
      relationships: {
        curriculum: curriculumId,
        learningOutcomes: [],
        assignment: null,
        sessions: []
      }
    }]);
  } else {
    files[`${dir}/weeks.json`] = "[]\n";
  }

  files["src/content/useContentPackage.ts"] = contentHook(config);
  return files;
}

function contentHook(config: ResolvedHubConfig): string {
  return `import { useEffect, useState } from "react";
import "@learning-platform/content";
import { APP_CONFIG } from "../config";

type ContentEngine = {
  loadPackage: (directory: string, io: unknown) => Promise<{ weeks?: unknown[] }>;
  browserIo: () => unknown;
  adaptCurriculum: (pkg: unknown) => { weeks: WeekSummary[] };
  validatePackage: (pkg: unknown) => { valid: boolean };
};

export type WeekSummary = {
  teachingWeek: number;
  weekKey: string;
  title: string;
  status: string;
  route: string;
};

function engine(): ContentEngine {
  const value = (globalThis as { LearningPlatformContent?: ContentEngine }).LearningPlatformContent;
  if (!value) throw new Error("LEARNING_PLATFORM_CONTENT_UNAVAILABLE");
  return value;
}

export function useContentPackage(root: string) {
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const content = engine();
    const directory = \`\${root}/\${APP_CONFIG.curriculumPackage}\`;
    content.loadPackage(directory, content.browserIo())
      .then((pkg) => {
        if (cancelled) return;
        const adapted = content.adaptCurriculum(pkg);
        setWeeks(adapted.weeks || []);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [root]);

  return { weeks, loading, error };
}

export const CONTENT_PACKAGE = ${JSON.stringify(contentPackageDir(config))};
`;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
