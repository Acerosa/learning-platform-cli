import type { ResolvedHubConfig } from "../config.js";

export function hubReadme(config: ResolvedHubConfig): string {
  return `# ${config.displayName}

Scaffolded by \`@learning-platform/cli\` as a Learning Platform learner hub.

- Profile: \`${config.profile}\`
- Course: \`${config.courseKey}\`
- Content engine: \`${config.useContentEngine}\`
- Core: \`${config.coreVersion}\`
- UI: \`${config.uiVersion}\`

This repository contains **platform structure**. It does not contain subject curriculum.
${config.useContentEngine ? "\nLearner bundles exclude authoritative marking data.\n" : ""}

## Local development

Place this hub beside the reviewed platform packages:

\`\`\`text
learning-platform-core/
learning-platform-ui/
${config.useContentEngine ? "learning-platform-content/\n" : ""}${config.repositoryName}/
\`\`\`

Then:

\`\`\`bash
npm install
npm run dev
npm test
\`\`\`

Dependencies use \`file:\` siblings. CI checks out the same packages at reviewed tags before \`npm ci\`.

To upgrade later, change the pinned tags in \`.github/workflows/pages.yml\` and \`docs/provenance.json\`, then reinstall.

## After creation

1. Review the generated hub.
2. Create the GitHub repository (the CLI does not do this).
3. Push a feature branch, then \`main\`.
4. Enable GitHub Pages from the Actions workflow.
5. Apply the lightweight branch-protection ruleset separately.
6. Register \`learning-platform-hub.json\` in Admin. The CLI never writes to hosted Supabase.
7. Author curriculum. Do not copy another hub's teaching content.

## What this CLI does not generate

- real weeks, tasks, questions or assessments
- hosted Supabase records
- GitHub repositories
- branch protection
- Next.js / SSR
`;
}
