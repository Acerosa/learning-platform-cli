# Learning Platform CLI

Canonical developer tooling for the Learning Platform.

This repository is **not** a hub-spawner-only package. It is `@learning-platform/cli`, binary `lp`. The first command is `lp create hub`. Later commands belong here too; they are not implemented in v0.1.0.

```text
learning-platform-core     → platform behaviour
learning-platform-ui       → shared React learner presentation
learning-platform-content  → curriculum schemas / validation / content contracts
learning-platform-cli      → orchestration, scaffolding and developer tooling
```

The CLI consumes those contracts. It does not invent competing schemas.

## Current command

```bash
lp create hub
lp create hub --config examples/minimal.json
lp create hub --config examples/minimal.json --out ./unit-99-example --force
```

| Option | Meaning |
| --- | --- |
| `--config` | Non-interactive JSON. Required unless a terminal is available for prompts. |
| `--out` | Destination directory. Defaults to the repository-safe hub id. |
| `--workspace-root` | Directory that contains `learning-platform-core` and `learning-platform-ui`. |
| `--force` | Overwrite generated filenames in a non-empty directory. Extra files are not deleted. |
| `--skip-install` | Skip `npm install`, typecheck and tests after generation. |

Interactive mode prompts for id, name, course, profile, context, colours, Content, and output directory. Without `--config` and without a TTY, the CLI exits with `LP_CONFIG_REQUIRED`.

## Install / use locally

The package is not published to npm yet. From a clone:

```bash
cd learning-platform-cli
npm install
npx lp create hub --config examples/minimal.json --out ../unit-99-example
```

`npm link` is optional if you want `lp` on your PATH.

Generated hubs use sibling `file:` dependencies. Place the new hub beside the reviewed packages (or pass `--workspace-root`):

```text
learning-platform-core/
learning-platform-ui/
learning-platform-content/   # required only when useContentEngine is true
unit-99-example/
```

Reviewed baselines: Core `0.2.0` (`v0.2.0`), UI `0.1.0` (`v0.1.0`), Content `0.1.0` (`v0.1.0`).

## Profiles

| Profile | Routes | Notes |
| --- | --- | --- |
| `minimal` | `/`, `resources/`, `help/`, `account/` | Generic learner hub. |
| `week-based` | plus `weeks/`, `weeks/week-1/` | Uses `WeekView`. No teaching content. |
| `task-based` | plus `foundations/`, `task-1/` | No `WeekView`. Task presentation stays hub-owned. |

`contextType` (`none` / `assignment` / `exam` / `project`) is configuration inside a profile, not a fourth template. Assignment/project add empty workspace routes on week-based and task-based hubs.

## Content engine

`"useContentEngine": true` adds `@learning-platform/content` and a canonical empty package under `content/<hubId>/`.

`"useContentEngine": false` does not add it.

## Generated architecture

The hub is a React 19 + TypeScript + Vite MPA with `base: "./"` for GitHub Pages. Nested refresh uses real directories, not hash routing.

Generated CI (in the **hub**, not this CLI) checks out Core/UI/(Content) at the reviewed tags, runs `npm ci` and `npm test`, then deploys `dist` from `main`. The CLI repository itself has no Pages deployment.

`learning-platform-hub.json` follows Hub Manifest 1.0.0. UI and Content versions are **not** stored there. They are recorded in `docs/provenance.json` together with the CLI version.

Registration remains:

```text
generated manifest → Admin Hub Registration → admin_api.register_hub
```

The CLI never writes to hosted Supabase.

## Safety behaviour

- Non-empty destinations fail unless `--force` is passed.
- `--force` overwrites generated filenames only. Extra user files are left in place. It does not recursively delete the destination.
- Privileged secrets (`service_role`, and similar) are rejected in config.
- Generated relative paths cannot escape the requested destination.
- `hubId` is lower-case kebab-case; repository names cannot be `.` or `..`.

## Command architecture

```text
src/
├── cli.ts
├── commands/create/hub/     ← current command
└── shared/

test/create-hub/
examples/
docs/
```

Future commands should be added as sibling modules under `src/commands/` without changing `create hub` internals.

## Deferred (not in v0.1.0)

These are planned homes only. They are **not** implemented:

- `lp create week`
- `lp create activity`
- `lp validate hub` / `lp validate content`
- `lp github create` / `lp github protect`

## What this CLI does not do

- invent curriculum, questions or assessments
- create GitHub repositories
- apply branch protection
- register hubs in Admin
- write to hosted Supabase
- publish to npm
- migrate existing hubs

See [docs/create-hub.md](docs/create-hub.md).
