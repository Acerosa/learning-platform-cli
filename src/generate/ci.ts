import { PACKAGE_BASELINE } from "../baselines.js";
import type { ResolvedHubConfig } from "../config/types.js";

export function githubWorkflow(config: ResolvedHubConfig): string {
  const contentCheckout = config.useContentEngine
    ? `
      - name: Check out reviewed Content
        uses: actions/checkout@v7
        with:
          repository: ${PACKAGE_BASELINE.content.repository}
          ref: ${PACKAGE_BASELINE.content.tag}
          path: ${PACKAGE_BASELINE.content.directory}
`
    : "";

  return `name: GitHub Pages

on:
  push:
    branches:
      - main
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out hub
        uses: actions/checkout@v7
        with:
          path: ${config.repositoryName}

      - name: Check out reviewed Core
        uses: actions/checkout@v7
        with:
          repository: ${PACKAGE_BASELINE.core.repository}
          ref: ${PACKAGE_BASELINE.core.tag}
          path: ${PACKAGE_BASELINE.core.directory}

      - name: Check out reviewed UI
        uses: actions/checkout@v7
        with:
          repository: ${PACKAGE_BASELINE.ui.repository}
          ref: ${PACKAGE_BASELINE.ui.tag}
          path: ${PACKAGE_BASELINE.ui.directory}
${contentCheckout}
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: "${PACKAGE_BASELINE.node}"
          cache: npm
          cache-dependency-path: ${config.repositoryName}/package-lock.json

      - name: Install, test and build
        working-directory: ${config.repositoryName}
        run: |
          npm ci
          npm test

      - name: Configure GitHub Pages
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        uses: actions/configure-pages@v6

      - name: Upload Pages artifact
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        uses: actions/upload-pages-artifact@v5
        with:
          path: ${config.repositoryName}/dist

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
`;
}

export function githubProtectionDoc(): string {
  return `# Branch protection

Do not apply repository rulesets from \`lp create hub\`.

After the GitHub repository exists, apply the lightweight production-branch policy used by the Learning Platform:

- protect the default production branch
- require a pull request (0 reviewers)
- require reliable PR checks only
- block force pushes and branch deletion
- keep owner/admin bypass

The reusable script lives in \`learning-platform-core\`:

\`\`\`bash
../learning-platform-core/scripts/github/apply-main-protection.sh --plan
\`\`\`

Do not enable signed commits, extra reviewers, or "do not allow bypassing".
`;
}
