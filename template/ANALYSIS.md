# Template analysis: what TEMPLATE1 takes from each source, and why

*Written 15 September 2026, from the extracted archives and the NexusPrompt repository at commit `4ada481`.*

## Method

Each template was read in full where it mattered: repository layout, build entry points, every workflow, dependency-update configuration, agent guidance, architecture documents and, where one existed, its feature-selection mechanism. NexusPrompt was treated as the reference for verification discipline, since it is the workflow this template must at least match.

Nine criteria, each asking whether a property is **enforced by the build**, merely **documented**, or **absent**:

| Criterion | NexusPrompt | go-clean-template | golang-repo-template | Josee9988 project-template | CleanArchitecture (.NET) | react-starter-kit | AstroWind | LikeC4 template |
|---|---|---|---|---|---|---|---|---|
| Feature selection | absent | absent | absent | personalization only | **enforced**: `dotnet new` symbols, matrix-tested | absent (upstream merge skill) | runtime flags | absent |
| Single verification gate | **enforced**: `npm run verify`, same in CI | Makefile targets; CI jobs differ | `rules.mk`; CI stale | script tests only | build and test | **enforced**: one CI job runs all checks | `check` + `build` | model tests |
| Supply chain pinning | **enforced**: SHA pins, checksummed binaries | absent: tags, `@main`, `curl \| bash` | absent: `@v3`, `@master` | absent | tags only | SHA pins by convention, not checked | tags only | `likec4@latest` |
| Least-privilege workflows | **enforced** by review, reasoned per job | absent | absent | absent | `contents: read` | strong: environment-scoped secrets, main-only guards | `contents: read` | partial |
| Architecture enforcement | **enforced**: boundary script, purity harness, callback guard | convention only | none | n/a | project references | conventions, ADRs | none | model rules as tests |
| Decisions and docs | 23 ADRs, amended not rewritten; generated docs with drift checks | README in three languages | README | script docs | ADR index and template | ADR template, VitePress docs | task recipes | README |
| Community health | SECURITY.md only | none | full set | full set, 8 issue templates, labels | issue templates, CoC | CoC, CONTRIBUTING, SECURITY | none | none |
| Agent guidance | long, invariant-driven CLAUDE.md | AGENTS→CLAUDE | none | none | none | **AGENTS.md canonical**, CLAUDE.md imports it, nested per workspace | AGENTS.md and task skills | none |
| Freshness | current | current (Go 1.26) | stale (Go 1.20, `set-output`) | stale (`checkout@v2`, retired bots) | current (.NET 10) | current | current | current |

## What each source contributed

### NexusPrompt (the reference workflow)

**Adopted.** One command that is the whole check, run identically by CI. Repository-shape hygiene (`check-repo-hygiene.mjs`), rewritten as a smaller generic chassis: pinned `.gitignore` rules with a truncation floor, no vendored directories at any depth, a size bound, strict JSON, nothing both tracked and ignored. Import-boundary checking over every file, with must-fire tests beside must-not-fire ones. SHA-pinned actions and a checksum-verified gitleaks binary. Report-only security that fails only when it *could not look*. ADRs that are superseded rather than rewritten. A security policy with a secret-rotation table. Least-privilege workflow tokens.

**Improved.** NexusPrompt documents SHA pinning in comments; here `check-hygiene` fails on an unpinned `uses:`, a workflow without `permissions:`, a job without a timeout, and a CI job missing from the required gate — rules a person would otherwise have to remember.

**Left out.** The domain-specific checks (differential oracle, anchor sizing, source freeze, truth boundary), the 30-step verify chain, and the single shared npm workspace, whose lockfile couples every package.

### go-clean-template (evrone)

**Adopted.** The layer vocabulary — `entity`, `usecase`, `repo`, `controller`, `app` — with interfaces declared by the consumer, configuration from the environment validated at startup, graceful shutdown, a multi-stage image with a minimal runtime, and a strict `golangci-lint` v2 configuration.

**Improved.** The layering there is convention. Here `internal/architecture_test.go` parses every production file and fails `go test` on a forbidden import, and its matcher has its own failing cases.

**Left out.** Four transports (REST, gRPC, AMQP, NATS), three domains, Postgres, RabbitMQ, NATS, Jaeger and generated mocks. One transport and one domain show the pattern; each addition is a controller or a repository behind an existing port. Also left out: unpinned actions, `nancy@main`, and `curl | bash` coverage upload.

### golang-repo-template (moul)

**Adopted.** The idea of a complete community-health set — code of conduct, contributing guide, code owners, issue and pull request templates, security policy — and grouped, scheduled dependency updates.

**Left out.** `rules.mk` (no `make` on Windows), goreleaser and semantic-release (release-please covers versioning for any language; goreleaser remains the right addition for a project that ships binaries), `repoman-action`, Gitpod, all-contributors, badges for retired services, and dual licensing. The workflows are stale enough — Go 1.20, `actions/checkout@v3`, deprecated `set-output` — that nothing was copied verbatim.

### Josee9988 project-template

**Adopted.** Post-copy initialization that personalizes the repository and removes itself, and issue templates that separate bugs, features and security reports.

**Improved.** Its script replaces strings with `sed` across `.github/`, prompts interactively, and offers no stack selection. `template/init.mjs` is scriptable with arguments and asks only in a terminal (a v1.1.0 addition, after dotnet-starter-kit's wizard), validates input, selects features, plans in memory before writing, and refuses a dirty tree. Markdown issue templates became GitHub issue forms, and the security "issue template" became a link to private vulnerability reporting — a public issue is the wrong channel for a vulnerability.

**Left out.** Probot configuration (`settings.yml`, `issue_label_bot.yaml`, welcome bots), which depends on apps that are retired or must be installed separately, and 20 opinionated labels.

### CleanArchitecture (Jason Taylor)

**Adopted — the most important idea.** A template must stay a working project under a real default identity, and CI must *generate every option combination and build and test the output*, not only the template. `template-test.yml` does this for every preset. Also adopted: an ADR index with a template, and warnings treated as errors (strict TypeScript, golangci-lint).

**Left out.** The .NET solution itself. It is best consumed as it is published, through `dotnet new ca-sln`; copying it would create a fork that ages. Its `dotnet new` engine does not apply outside .NET, which is why selection here uses a zero-dependency Node script with a simpler marker grammar.

### react-starter-kit (Kriasoft)

**Adopted.** `AGENTS.md` as the canonical agent guidance with `CLAUDE.md` importing it. Workflow craft: SHA pins with version comments, `persist-credentials: false`, per-job timeouts, concurrency that cancels only superseded pull request runs, `pull_request_target` used only where it never checks out untrusted code. The pull-request-title check against Conventional Commits, with Dependabot commit prefixes chosen to pass it. Grouped weekly updates. Opt-in deployment through a repository variable, reused here for CodeQL and Pages.

**Left out.** Bun, Cloudflare Workers, Terraform, Better Auth, Stripe, tRPC and Drizzle — a product stack, not a template concern — and the shared workspace lockfile.

### AstroWind

**Adopted.** Short task-oriented agent instructions and a verification checklist. Its runtime feature flags (`apps.blog.isEnabled`) informed the decision *not* to select features at runtime: disabled features still ship as dead code and dependencies.

**Left out.** The Astro site and its widget library. A marketing or content site is a product choice; it can be added as a feature by following `template/README.md`.

### LikeC4 template

**Adopted.** Architecture as code, with model rules as tests and a Pages deployment. Here the rules are plain functions over the model API, so each is tested against a hand-built model that breaks it, and the model's contents follow the selected features.

**Improved.** `likec4: latest` became a locked dependency, and the deployment is opt-in and SHA-pinned.

## Decisions for the synthesis

1. **Selection by a local, zero-dependency initializer** — feature paths, marker blocks and identity replacement. *Rejected:* Cookiecutter or Copier (a Python runtime, and a template that is no longer a runnable repository), `dotnet new` (.NET only), a GitHub Actions initializer (`GITHUB_TOKEN` cannot write workflow files), runtime flags (dead code ships).
2. **A generated project must pass its own gate.** Every preset is generated and verified in CI, so a template change that breaks one combination fails before a repository is created from it.
3. **One required check** aggregating per-module jobs, mirrored by `scripts/verify.mjs` ([ADR-0002](../docs/adr/0002-one-required-check.md)).
4. **Pins enforced, not documented** ([ADR-0003](../docs/adr/0003-pin-third-party-code.md)).
5. **Independent modules** with their own lockfiles, so a feature can be removed by deleting a directory ([ADR-0004](../docs/adr/0004-independent-modules.md)).
6. **Layer rules as tests** in each service's own toolchain ([ADR-0005](../docs/adr/0005-layered-services-with-enforced-boundaries.md)).
7. **The same service twice**, in Go and TypeScript, with identical routes, status codes and configuration: the architecture is the point, and parity shows it is language-independent.
8. **Only what has no product opinion.** Deployment targets, databases, authentication and UI frameworks beyond a minimal React app are left to the project.

## Known limitations

- Initialization is one-way. Later template improvements must be merged into a project by hand; an upstream-merge procedure like react-starter-kit's `merge-seed` skill would be the next thing to add.
- A marker block depends on exactly one feature (see `template/README.md`).
- CodeQL and the Pages deployment are opt-in, so the template's own CI does not exercise them while the repository is private.
- The workflow checks in `check-hygiene` read the two-space YAML layout this repository uses, not arbitrary YAML.
- `release.yml` needs a token secret for its pull requests to trigger the required check; the workflow header says how.

## Second round: eleven more sources (template v1.1.0)

*Added 15 September 2026.* The second set was read the same way: layout, build and CI, enforcement, agent guidance, and anything a generated project would otherwise have to add by hand.

| Source | Strength | Taken into TEMPLATE1 | Left out, and why |
|---|---|---|---|
| bulletproof-react | Feature folders with one-way imports (shared → features → app), enforced by ESLint; unit, component and end-to-end test layers | `web` reorganised by feature; a dependency-free boundary check with failing cases; Testing Library component tests in happy-dom | Playwright end-to-end tests (a browser download per CI run for a two-screen example), Storybook, plop generators, three app variants |
| swr | A library published well: `exports` map, are-the-types-wrong on the packed tarball, npm trusted publishing | `ts-library` feature: single `exports` entry, publint and attw on the tarball, tokenless publishing with provenance on release | Dual ESM/CJS builds (Node 24 consumers import ESM), canary and legacy React matrices |
| dotnet-starter-kit | A setup wizard; a lean AGENTS.md with on-demand rules and task skills; architecture tests; a smoke test that scaffolds from the template | Interactive `init` with defaults read from `origin`; `.claude/skills` for recurring tasks. The smoke test already existed as `template-test.yml` | The product modules (multitenancy, billing, chat), path-filtered CI jobs, Terraform |
| fastapi-clean-example | Layer contracts with import-linter; `pip-audit` in the check; a test taxonomy by infrastructure need | Dependency vulnerability audits: `npm audit` for every lockfile and govulncheck for Go, report-only | Database, migrations and their stairway test: the services keep an in-memory store until a project chooses one |
| node.js-clean-architecture | Entities, use cases, adapters and frameworks as separate layers | Already present in both services, with the rules enforced rather than described | Express, MongoDB and Redis |
| electron-boilerplate | Desktop packaging, auto-update, single-instance lock | Nothing yet | A desktop feature means choosing Electron or Tauri and a signing and update story; that is a product decision, listed as a next step |
| Best-README-Template, awesome-readme-template | A README a stranger can act on: badges, prerequisites, getting started | A status and licence badge row and a prerequisites list that follows the selected features | Screenshots, roadmap, acknowledgements and contact sections, which only a real project can fill in |
| Awesome-Repo-Template | Community files and a disclosure process | "What happens after you report" in SECURITY.md | Its workflow that rewrites files with a push token, and Probot bot configuration |
| awesome-github-templates, awesome-clean-code-projects | Curated lists | Repository topics, so the template is found the way those lists find templates | No code to adopt |

The limitations section above still applies; in addition, publishing to npm cannot be exercised by the template's own CI, because a trusted publisher has to be configured on npmjs.com for a real package first.

## Third round: six more sources (template v1.2.0)

*Added 17 September 2026.* This set was read for one question: what does a repository need in order to be worked on by coding agents as well as by people, and what of that belongs in a template rather than in a project.

| Source | Strength | Taken into TEMPLATE1 | Left out, and why |
|---|---|---|---|
| likec4 (the tool's own repository) | A large model kept honest by its own build: the model is code, and CI fails on a model that no longer parses or breaks a rule | Already present as the `architecture` feature; this round confirmed the shape rather than changing it — rules as plain functions, each with a test that breaks it | Its monorepo build, documentation site and playground: tool development, not template concerns |
| modelcontextprotocol (specification and TypeScript SDK) | A protocol with a stable shape for exposing capability to a model: tools with declared schemas, results that separate a failure the caller can act on from a protocol error | The `mcp-server` feature, on SDK v2: tools declared with Zod schemas, failures returned as `isError`, the server driven in tests through a real client over an in-memory transport pair | The other server features — resources, prompts, sampling, elicitation, HTTP transports and OAuth. One transport and three tools show the pattern; each addition is another `registerTool` behind the same port |
| MCP-Platform | Catalogues and deploys many MCP servers behind one gateway | Nothing directly. It answers a question a template cannot: which servers an organisation runs. What it argued for is that a server should be a plain subprocess with configuration from the environment, which is what the feature is | The gateway, the registry and the Docker/Kubernetes deployment layer: a platform is a product |
| gemini-docs-template | Vendor-specific agent instructions (`GEMINI.md`) kept beside the code | `GEMINI.md`, but as a pointer rather than a copy | Its instructions themselves, which are for a different project |
| github-copilot-agent-template | `.github/copilot-instructions.md`, and instructions written for an agent that opens pull requests | `.github/copilot-instructions.md`, also as a pointer | Its workflow-driven agent setup, which assumes a Copilot subscription and a particular review process |
| custom-agents-template | A directory of role-shaped agent definitions with frontmatter, selected by name and description | The frontmatter discipline, applied to the skills that were already here: `scripts/check-docs.mjs` fails a `SKILL.md` whose name does not match its directory or whose description is missing or over the length a loader accepts | The roles themselves (architect, reviewer, tester …). A repository's procedures are its own; the template ships the ones its own modules need |

**The decision the vendor files forced.** Three assistants, three filenames, and nothing in any of them saying which is current. Rather than maintain three copies, `AGENTS.md` stays the only instructions, `CLAUDE.md` is the import line, and the other two are pointers a check keeps short — so the failure mode that matters, four files quietly disagreeing, cannot survive a build.

**What the MCP feature is architecturally.** It is a second inbound adapter over the same domain, with the API behind an outbound port: the transport changed and nothing else did. That is the claim this template makes about its structure, and shipping a third module that obeys it is the only way to show the claim holds.

## Fourth round: twelve more sources (template v1.3.0)

*Added 18 September 2026.* This round asked whether the template is *universal* — whether its structure holds outside the two ecosystems it was proved in, and whether a repository built from it is ready for the agents that now do much of the work in one.

| Source | Strength | Taken into TEMPLATE1 | Left out, and why |
|---|---|---|---|
| likec4 (the tool's repository) | An explicit adapter policy in AGENTS.md, enforced by `check-agent-instructions.mjs` with tests; `copilot-setup-steps.yml` | The `AGENT.md` and case-variant rules; the cloud-agent setup workflow | Symlinked skill adapters, which break in a default Windows checkout ([ADR-0009](../docs/adr/0009-where-agent-adapters-and-skills-live.md)); its 35 pinned "required" and "stale" sentences — a regression test for prose, too costly to impose on every project |
| codebase-memory-mcp | The most mature CI in the set: reusable `_*.yml` workflows, path-gated heavy jobs, OpenSSF Scorecard, DCO, one stable summary check required by branch protection | Scorecard, opt-in; the growth path, as [docs/growing-the-ci.md](../docs/growing-the-ci.md) rather than shipped machinery | DCO, stale-issue and labelling bots: community policy a project chooses for itself |
| multica | A Go + TypeScript monorepo whose AGENTS.md tables package boundaries and the narrowest check per scope | Confirmation of the shape already here; `CLAUDE.md` = `@AGENTS.md` exactly, as in likec4 | Its nested `AGENTS.md` for mobile — here each module's rules sit in a marker block of the one file, removed with the feature |
| plane | Skills for repository workflow (branch names, pull requests, release notes) and repository invariants as CI jobs | Nothing new; the invariant-as-a-check principle was already the chassis | Its product stack and its Docker-based backend tests |
| modelcontextprotocol/servers | A TypeScript and Python polyglot repository: `uv sync --frozen`, pyright, `uv build`, PyPI trusted publishing | The Python toolchain for `py-service` | Its scheduled release that chooses versions from a script; unpinned actions |
| strix | Modern Python packaging: `[dependency-groups]`, ruff, mypy, bandit, pre-commit | ruff with bandit's rules (`S`) and strict mypy in `py-service` | pre-commit hooks: the same checks already run in `verify`, locally and in CI |
| context7 | Publishes to the official MCP Registry with `mcp-publisher login github-oidc` and a root `server.json` | `services/mcp-server/server.json` and `mcp-publish.yml`, tokenless, with the publisher checksum-pinned | `curl | tar` of an unpinned latest release; `${{ }}` interpolated into `run:` |
| github-copilot-agent-template | The full Copilot surface — `.github/agents`, `.github/prompts`, `.github/skills` — validated in CI, including relative links | The link rule, and frontmatter rules for prompt and agent files; one starter prompt | Grep-based validation (it would flag link syntax quoted as code); per-commit message linting, which squash merging makes redundant |
| ui-ux-pro-max-skill | Skills at scale, with regression tests for the skills themselves | Confirmation that skill descriptions run long, which the 1,024-character rule already bounds | The skills: they are a product, not a template concern |
| agents.md | The format's own guidance: an AGENTS.md is mostly the traps a newcomer would walk into | Nothing to change; AGENTS.md here already leads with what fails the build | — |
| andrej-karpathy-skills | The same guidance shipped as a skill, a CLAUDE.md and a Cursor rule | A live example of the duplication [ADR-0006](../docs/adr/0006-one-set-of-agent-instructions.md) prevents | — |
| localtunnel | — | Nothing | A small library with none of this; a useful reminder of the baseline |

**What the round established.** Three unrelated, mature repositories — likec4, codebase-memory-mcp and multica — arrived independently at decisions this template already enforces: `AGENTS.md` canonical with `CLAUDE.md` exactly `@AGENTS.md`, one aggregate required check, actions pinned to commit SHAs with `persist-credentials: false`, and tokenless publishing. That is evidence the spine is right rather than idiosyncratic.

**What it changed.** The architecture claim now rests on three languages: `py-service` answers the same routes as `api-go` and `api-ts`, enforces its layers with Python's own parser, and depends on nothing at runtime ([ADR-0008](../docs/adr/0008-a-third-language-and-what-a-module-must-prove.md), which also states the five things any module must prove). A repository built from the template now prepares a cloud agent's environment, governs every agent adapter, and checks that every relative link resolves ([ADR-0009](../docs/adr/0009-where-agent-adapters-and-skills-live.md)). Scorecard and MCP Registry publishing are one repository variable away.

**What building it found.** Four defects, each caught by a check before it could ship: the Python boundary checker did not resolve relative imports (caught by its must-fire test); `.gitignore` had no Python rules, so a first run committed 17 bytecode files (now a hygiene rule); the preset job installed no uv (caught by generating every preset in CI); and the ADR template linked a placeholder path (caught by the new link rule on its first run).
