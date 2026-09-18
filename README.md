# TEMPLATE1

[![verify](https://github.com/hynix666/TEMPLATE1/actions/workflows/verify.yml/badge.svg)](https://github.com/hynix666/TEMPLATE1/actions/workflows/verify.yml) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- ultra:begin template -->
**A GitHub repository template that starts a project with the verification, supply-chain and architecture discipline most projects only add after their first incident — and lets you choose the stack.**

It combines the strongest ideas of thirty-four templates and references, including NexusPrompt's own workflow. [template/ANALYSIS.md](template/ANALYSIS.md) records what was taken from each and what was left out, and why.

- **One gate.** `node scripts/verify.mjs` runs what CI runs, and CI reports a single required check, `verify`.
- **A pinned supply chain the build enforces.** Actions pinned to commit SHAs, checksum-verified binaries, digest-pinned images.
- **Repository hygiene checks.** A tracked `.env`, a vendored `node_modules`, a truncated `.gitignore`, a 50 MB blob, or a CI job left out of the gate each fail the build.
- **Clean Architecture services whose layer rules are tests**, in Go, TypeScript and Python — the same structure proved in three toolchains, and the same API proved by one contract every service is started and checked against.
- **A feature-sliced web app and a publishable library**, each with its import or packaging rules checked.
- **An MCP server for agents**, built on the official SDK and tested through a real client, not a mock.
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
| `mcp-server` | MCP server on the official SDK: task tools over stdio for an AI assistant, same layers, driven in tests by a real client |
| `py-service` | Python HTTP service on the standard library: pure domain, WSGI transport, ruff and strict mypy, layer rules enforced by an `ast`-based check |
| `web` | React + Vite app organised by feature (bulletproof-react), import boundaries checked on every file, unit and component tests |
| `ts-library` | TypeScript library for npm: one `exports` entry, publint and are-the-types-wrong checks on the packed tarball, tokenless trusted publishing with provenance |
| `architecture` | LikeC4 model of the system, with model rules as tests and an opt-in GitHub Pages site |
| `release` | release-please: release pull requests, tags and `CHANGELOG.md` from Conventional Commits |
| `devcontainer` | Dev Container with the toolchains of the features you selected |

| Preset | Features |
|---|---|
| `minimal` | none: the chassis only (hygiene, CI, security, community files, ADRs) |
| `go-api` | `go-service`, `architecture`, `release`, `devcontainer` |
| `py-api` | `py-service`, `architecture`, `release`, `devcontainer` |
| `fullstack-ts` | `ts-service`, `web`, `architecture`, `release`, `devcontainer` |
| `library` | `ts-library`, `release`, `devcontainer` |
| `mcp` | `mcp-server`, `release`, `devcontainer` |
| `all` | every feature |

Init deletes the features you did not select, keeps or removes the marked blocks in shared files such as workflows and this README, replaces the template's name and owner with yours, and deletes itself. [template/README.md](template/README.md) explains the mechanism and how to add a feature.

---
<!-- ultra:end template -->

## Layout

- `scripts/` — `setup.mjs` installs every module, `verify.mjs` runs the whole check, `check-hygiene.mjs` guards the repository's shape, `check-docs.mjs` its documentation, and `check-contract.mjs` holds every task service to the one API contract in `scripts/contract/`.
<!-- ultra:begin go-service -->
- `services/api-go/` — Go task API in Clean Architecture layers. [README](services/api-go/README.md)
<!-- ultra:end go-service -->
<!-- ultra:begin ts-service -->
- `services/api-ts/` — TypeScript task API with a pure domain core. [README](services/api-ts/README.md)
<!-- ultra:end ts-service -->
<!-- ultra:begin py-service -->
- `services/api-py/` — Python task API, same routes and layers. [README](services/api-py/README.md)
<!-- ultra:end py-service -->
<!-- ultra:begin mcp-server -->
- `services/mcp-server/` — MCP server exposing the task API to an AI assistant. [README](services/mcp-server/README.md)
<!-- ultra:end mcp-server -->
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
- `.claude/skills/` — step-by-step procedures coding agents follow for recurring tasks. `.github/prompts/` holds Copilot prompt files that wrap one of them; `AGENTS.md` holds the rules all of them follow.
- `.github/` — workflows, issue forms, pull request template, Dependabot and code owners.

## Getting started

Prerequisites:

- Node 24 (`.node-version`), for the scripts and every Node module.
<!-- ultra:begin go-service -->
- Go 1.26 (`services/api-go/go.mod`), and golangci-lint for the complete local check.
<!-- ultra:end go-service -->
<!-- ultra:begin py-service -->
- Python 3.13 or newer and [uv](https://docs.astral.sh/uv/) (`services/api-py/.python-version`), which installs the rest.
<!-- ultra:end py-service -->
- The GitHub CLI, only for `configure-github.mjs`.

Each toolchain version is pinned once, in the file that toolchain reads: `.node-version`, `go.mod`, `.python-version`. Version managers such as mise and asdf can be configured to read those files directly, so there is no `.tool-versions` to keep in step with them.

```bash
node scripts/setup.mjs              # install the dependencies of every module present
node scripts/verify.mjs             # the whole check, as CI runs it
node scripts/verify.mjs <module>    # the chassis plus the named modules only
node scripts/check-hygiene.mjs      # repository-shape rules only
node scripts/check-docs.mjs         # agent instructions and the docs index
node scripts/configure-github.mjs   # apply repository settings: merging, required check, security
```

## Continuous integration

- **`verify.yml`** — on every push and pull request: repository hygiene, chassis tests, actionlint, and one job per module — each service job also runs the API contract and starts the service's container image to prove it answers — all feeding the aggregate **`verify`** job, which is the only required check ([ADR-0002](docs/adr/0002-one-required-check.md)).
- **`pr-title.yml`** — pull request titles follow Conventional Commits.
- **`copilot-setup-steps.yml`** — the environment GitHub's Copilot coding agent prepares before it works here: every toolchain the selected features need, then `node scripts/setup.mjs`. It runs on its own only when it changes.
- **`security.yml`** — report-only scans that fail only when a scan could not run: gitleaks over new commits and weekly over history, `npm audit` for every npm lockfile, and pip-audit for the Python lockfile when that service is present.
<!-- ultra:begin go-service -->
- **`security.yml`, Go** — govulncheck, reporting only vulnerabilities in code the Go service actually calls.
<!-- ultra:end go-service -->
- **`codeql.yml`** — CodeQL analysis; enable it by setting the repository variable `CODEQL_ENABLED=true` (needs a public repository or GitHub Advanced Security).
- **`scorecard.yml`** — [OpenSSF Scorecard](https://scorecard.dev): an outside measurement of the practices this repository claims, published and uploaded to code scanning; enable it with `SCORECARD_ENABLED=true` on a public repository.
<!-- ultra:begin mcp-server -->
- **`mcp-publish.yml`** — after a release, pushes the MCP server's image to GitHub Container Registry and its `server.json` to the MCP Registry, tokenlessly; enable it with `MCP_PUBLISH_ENABLED=true` ([how](services/mcp-server/README.md#publish)).
<!-- ultra:end mcp-server -->
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
