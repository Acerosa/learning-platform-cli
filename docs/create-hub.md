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
├── resources/
├── help/
├── account/
├── test/
├── learning-platform-hub.json
├── docs/provenance.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Vite collects every `index.html` as an MPA input with `base: "./"`. Nested refresh uses real directories, not hash routing.

## Provenance

Generated hubs record generator provenance in `docs/provenance.json`:

```json
{
  "generator": "@learning-platform/cli",
  "generatorVersion": "0.1.0",
  "coreVersion": "0.2.0",
  "uiVersion": "0.1.0",
  "contentVersion": "0.1.0"
}
```

`contentVersion` is `null` when Content is not selected. Source repositories and reviewed tags are also recorded under `packages`. Those fields are not added to `learning-platform-hub.json`.

## Manifest / Admin

`learning-platform-hub.json` follows Hub Manifest 1.0.0. Unknown fields are invalid.

Registration remains:

```text
generated manifest → Admin Hub Registration → admin_api.register_hub
```

The CLI never writes to hosted Supabase.

## CI / Pages (generated hubs)

The generated hub workflow matches the reviewed T Level / Unit 3 Actions majors:

- checkout hub, Core `v0.2.0`, UI `v0.1.0`, optional Content `v0.1.0`
- Node 22
- `npm ci` and `npm test` (typecheck, unit tests, Vite build, post-build route checks)
- deploy `dist` from `main` only

This CLI repository does not deploy Pages.

## Branch protection

Not applied during `create hub`. See the generated `docs/github-protection.md`.

## What `lp create hub` does not generate

- real curriculum, questions or assessments
- hosted database records
- GitHub repositories
- branch protection
- Next.js / SSR
- `platform.client` or T Level / Unit 3 compatibility aliases
