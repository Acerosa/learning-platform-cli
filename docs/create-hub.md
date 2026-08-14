# `lp create hub`

## Config schema

```json
{
  "hubId": "unit-99-example",
  "displayName": "Unit 99 Example",
  "courseKey": "ocr-level-3-it",
  "profile": "week-based",
  "contextType": "assignment",
  "useContentEngine": true,
  "branding": {
    "primary": "#123456",
    "accent": "#abcdef"
  }
}
```

Required: `hubId`, `displayName`, `courseKey`, `profile`, `useContentEngine`.

Optional: `description`, `repositoryName`, `version`, `contextType`, `branding`, `shortName`, `qualification`, `githubOwner`, `repositoryUrl`, `deploymentUrl`, `supabase`, `outputDir`, `workspaceRoot`, package versions.

Validation errors use stable codes such as `LP_INVALID_HUB_ID`, `LP_UNSUPPORTED_PROFILE`, `LP_INVALID_COLOUR`, `LP_PRIVILEGED_KEY`.

Known course keys today: `ocr-level-3-it`, `t-level-digital-software-development`. Other kebab-case keys warn; Admin registration still requires a reviewed course.

## Generated structure

```text
example-hub/
├── .github/workflows/pages.yml
├── src/
├── css/hub.css
├── public/            # not used; Vite MPA HTML lives at real routes
├── resources/
├── help/
├── account/
├── tests/             # node tests live in test/
├── learning-platform-hub.json
├── docs/provenance.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Vite collects every `index.html` as an MPA input with `base: "./"`. Nested refresh uses real directories, not hash routing.

## Manifest / Admin

`learning-platform-hub.json` follows Hub Manifest 1.0.0. Unknown fields are invalid.

Registration remains:

```text
generated manifest → Admin Hub Registration → admin_api.register_hub
```

The CLI never writes to hosted Supabase.

UI and Content versions are recorded in `docs/provenance.json` because they are not part of the current manifest schema.

## CI / Pages

The workflow matches the reviewed T Level / Unit 3 Actions majors:

- checkout hub, Core `v0.2.0`, UI `v0.1.0`, optional Content `v0.1.0`
- Node 22
- `npm ci` and `npm test` (typecheck, unit tests, Vite build, post-build route checks)
- deploy `dist` from `main` only

The CLI does not deploy.

## Branch protection

Not applied during `create hub`. See the generated `docs/github-protection.md`.

## What the spawner does not generate

- real curriculum, questions or assessments
- hosted database records
- GitHub repositories
- branch protection
- Next.js / SSR
- `platform.client` or T Level / Unit 3 compatibility aliases
