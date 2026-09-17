# TEMPLATE1

[![verify](https://github.com/hynix666/TEMPLATE1/actions/workflows/verify.yml/badge.svg)](https://github.com/hynix666/TEMPLATE1/actions/workflows/verify.yml) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- ultra:begin template -->
**A GitHub repository template that starts a project with the verification, supply-chain and architecture discipline most projects only add after their first incident — and lets you choose the stack.**

It combines the strongest ideas of nineteen templates and references, including NexusPrompt's own workflow. [template/ANALYSIS.md](template/ANALYSIS.md) records what was taken from each and what was left out, and why.

- **One gate.** `node scripts/verify.mjs` runs what CI runs, and CI reports a single required check, `verify`.
- **A pinned supply chain the build enforces.** Actions pinned to commit SHAs, checksum-verified binaries, digest-pinned images.
- **Repository hygiene checks.** A tracked `.env`, a vendored `node_modules`, a truncated `.gitignore`, a 50 MB blob, or a CI job left out of the gate each fail the build.
- **Clean Architecture services whose layer rules are tests**, in Go and TypeScript, with identical APIs.
- **A feature-sliced web app and a publishable library**, each with its import or packaging rules checked.
- **Architecture as code.** A LikeC4 model with rules checked in CI.
- **One set of instructions for agents.** `AGENTS.md` is the only copy; `CLAUDE.md`, `GEMINI.md` and Copilot's file point at it, and a check fails when one starts saying something else.
- **Selectable features, tested.** CI generates a project from every preset and runs that project's own checks.

## Start a project

1. **[Use this template](https://github.com/hynix666/TEMPLATE1/generate)** to create a new repository, then clone it.
2. List the features and presets:

   ```bash
   node template/init.mjs --list
   ```

3. Initialize. This needs Node 24 and a clean working tree. Run in a terminal, init reads the owner and repository from `origin`, asks for anything else, shows the plan and waits for your confirmation:

   ```bash
   node template/init.mjs
   ```

   Or pass everything, for scripts: `node template/init.mjs --preset fullstack-ts` or `--features go-service,release`, with `--name`/`--owner` to override the defaults and `--dry-run` to see the plan only.

4. Install, verify and commit:

   ```bash
   node scripts/setup.mjs && node scripts/verify.mjs
   git add -A && git commit -m "chore: initialize project"
   ```

5. Push, then apply the settings GitHub does not copy from a template: squash-only merging, a ruleset on `main` requiring a pull request and the **`verify`** check, Dependabot security updates, private vulnerability reporting and secret scanning. Preview with `--dry-run`; it needs the GitHub CLI signed in as a repository admin.

   ```bash
   git push && node scripts/configure-github.mjs
   ```

| Feature | What you get |
|---|---|
| `go-service` | Go HTTP service in Clean Architecture layers, standard library only; a test enforces the layer rules; golangci-lint; distroless image |
| `ts-service` | TypeScript HTTP service run directly by Node 24; pure domain core; import boundaries checked on every file; no runtime dependencies |
| `web` | React + Vite app organised by feature (bulletproof-react), import boundaries checked on every file, unit and component tests |
| `ts-library` | TypeScript library for npm: one `exports` entry, publint and are-the-types-wrong checks on the packed tarball, tokenless trusted publishing with provenance |
| `architecture` | LikeC4 model of the system, with model rules as tests and an opt-in GitHub Pages site |
| `release` | release-please: release pull requests, tags and `CHANGELOG.md` from Conventional Commits |
| `devcontainer` | Dev Container with the toolchains of the features you selected |

| Preset | Features |
|---|---|
| `minimal` | none: the chassis only (hygiene, CI, security, community files, ADRs) |
| `go-api` | `go-service`, `architecture`, `release`, `devcontainer` |
| `fullstack-ts` | `ts-service`, `web`, `architecture`, `release`, `devcontainer` |
| `library` | `ts-library`, `release`, `devcontainer` |
| `all` | every feature |

Init deletes the features you did not select, keeps or removes the marked blocks in shared files such as workflows and this README, replaces the template's name and owner with yours, and deletes itself. [template/README.md](template/README.md) explains the mechanism and how to add a feature.

---
<!-- ultra:end template -->

## Layout

- `scripts/` — `setup.mjs` installs every module, `verify.mjs` runs the whole check, `check-hygiene.mjs` guards the repository's shape, `check-docs.mjs` its documentation.
<!-- ultra:begin go-service -->
- `services/api-go/` — Go task API in Clean Architecture layers. [README](services/api-go/README.md)
<!-- ultra:end go-service -->
<!-- ultra:begin ts-service -->
- `services/api-ts/` — TypeScript task API with a pure domain core. [README](services/api-ts/README.md)
<!-- ultra:end ts-service -->
<!-- ultra:begin web -->
- `apps/web/` — React single-page app, organised by feature. [README](apps/web/README.md)
<!-- ultra:end web -->
<!-- ultra:begin ts-library -->
- `packages/ts-library/` — TypeScript library published to npm. [README](packages/ts-library/README.md)
<!-- ultra:end ts-library -->
<!-- ultra:begin architecture -->
- `architecture/` — LikeC4 model of the system. [README](architecture/README.md)
<!-- ultra:end architecture -->
- `docs/` — [the documentation index](docs/README.md) and the rules for keeping it true; `docs/adr/` holds the architecture decision records.
- `.claude/skills/` — step-by-step procedures coding agents follow for recurring tasks.
- `.github/` — workflows, issue forms, pull request template, Dependabot and code owners.

## Getting started

Prerequisites:

- Node 24 (`.node-version`), for the scripts and every Node module.
<!-- ultra:begin go-service -->
- Go 1.26 (`services/api-go/go.mod`), and golangci-lint for the complete local check.
<!-- ultra:end go-service -->
- The GitHub CLI, only for `configure-github.mjs`.

```bash
node scripts/setup.mjs              # install the dependencies of every module present
node scripts/verify.mjs             # the whole check, as CI runs it
node scripts/verify.mjs <module>    # the chassis plus the named modules only
node scripts/check-hygiene.mjs      # repository-shape rules only
node scripts/check-docs.mjs         # agent instructions and the docs index
node scripts/configure-github.mjs   # apply repository settings: merging, required check, security
```

## Continuous integration

- **`verify.yml`** — on every push and pull request: repository hygiene, chassis tests, actionlint, and one job per module, all feeding the aggregate **`verify`** job, which is the only required check ([ADR-0002](docs/adr/0002-one-required-check.md)).
- **`pr-title.yml`** — pull request titles follow Conventional Commits.
- **`security.yml`** — report-only scans that fail only when a scan could not run: gitleaks over new commits and weekly over history, and `npm audit` for every npm lockfile.
<!-- ultra:begin go-service -->
- **`security.yml`, Go** — govulncheck, reporting only vulnerabilities in code the Go service actually calls.
<!-- ultra:end go-service -->
- **`codeql.yml`** — CodeQL analysis; enable it by setting the repository variable `CODEQL_ENABLED=true` (needs a public repository or GitHub Advanced Security).
<!-- ultra:begin release -->
- **`release.yml`** — release-please on `main`, off until `RELEASE_ENABLED=true`, which `configure-github.mjs` sets. Releases start at `0.1.0`, and each release pull request gets a dispatched `verify` run, so it can pass the required check without a personal token.
<!-- ultra:end release -->
<!-- ultra:begin ts-library -->
- **Library publishing** — with `release` selected, each release publishes `packages/ts-library` to npm with provenance once `NPM_PUBLISH_ENABLED=true` is set and npm trusts the workflow ([how](packages/ts-library/README.md#publish)).
<!-- ultra:end ts-library -->
<!-- ultra:begin architecture -->
- **`architecture.yml`** — publishes the architecture model to GitHub Pages once `PAGES_ENABLED=true` is set.
<!-- ultra:end architecture -->
<!-- ultra:begin template -->
- **`template-test.yml`** — template only: generates a project from every preset and runs its setup, verify and actionlint.
<!-- ultra:end template -->

Dependabot proposes grouped updates weekly for every ecosystem present, SHA-pinned actions included.

## Contributing and security

[CONTRIBUTING.md](CONTRIBUTING.md) describes the workflow, [SECURITY.md](SECURITY.md) how to report a vulnerability privately, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) the expected conduct. Guidance for coding agents is in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
