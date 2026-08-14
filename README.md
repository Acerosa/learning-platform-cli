# @learning-platform/cli

Scaffold a new Learning Platform learner hub from the shared React + TypeScript + Vite baseline.

```bash
npm install
npm link   # optional; exposes the `lp` binary
lp create hub --config examples/minimal.json --out ./unit-99-example
```

The CLI generates **platform structure**. It does not invent curriculum, create GitHub repositories, register hubs, or apply branch protection.

## Commands

```text
lp create hub
lp create hub --config hub.json
lp create hub --config hub.json --out ./my-hub --workspace-root .. --force
```

| Option | Meaning |
| --- | --- |
| `--config` | Non-interactive JSON. Required unless a terminal is available for prompts. |
| `--out` | Destination directory. Defaults to the repository-safe hub id. |
| `--workspace-root` | Directory that contains `learning-platform-core` and `learning-platform-ui`. |
| `--force` | Overwrite generated filenames in a non-empty directory. Extra files are not deleted. |
| `--skip-install` | Skip `npm install`, typecheck and tests after generation. |

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

## Dependencies

Generated hubs use sibling `file:` dependencies:

```text
file:../learning-platform-core
file:../learning-platform-ui
file:../learning-platform-content   # only when selected
```

Reviewed baselines: Core `0.2.0` (`v0.2.0`), UI `0.1.0` (`v0.1.0`), Content `0.1.0` (`v0.1.0`).

CI checks out those tags as siblings, then runs `npm ci`. To upgrade later, change the workflow refs and `docs/provenance.json`.

## After creation

1. Review the generated hub.
2. Create the GitHub repository.
3. Push a feature branch, then `main`.
4. Enable GitHub Pages from the generated Actions workflow.
5. Apply the lightweight branch-protection ruleset separately.
6. Register `learning-platform-hub.json` in Admin.
7. Author curriculum.

See [docs/create-hub.md](docs/create-hub.md).
