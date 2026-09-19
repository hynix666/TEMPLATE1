import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { MODULES } from "../scripts/modules.mjs";
import {
  applyMarkers, DESCRIPTION_ANCHOR, describeProject, InitError, loadManifest, MARKER_RE, originDefaults, originIdentity, recordDescription,
  removedPaths, replaceIdentity, resolveSelection, ROOT, toProjectName, validateDescription, validateIdentity, validateManifest,
} from "./init.mjs";

test("the template's own remote is never used as the project's identity", () => {
  const manifest = loadManifest();
  assert.equal(originDefaults(manifest, "git@github.com:hynix666/TEMPLATE1.git"), null);
  assert.equal(originDefaults(manifest, "https://github.com/HYNIX666/template1"), null);
  assert.deepEqual(originDefaults(manifest, "git@github.com:octo-org/demo-app.git"), { owner: "octo-org", repo: "demo-app" });
});

test("the owner and repository default from a GitHub origin remote", () => {
  assert.deepEqual(originIdentity("git@github.com:octo-org/My.Repo.git"), { owner: "octo-org", repo: "My.Repo" });
  assert.deepEqual(originIdentity("https://github.com/octo-org/demo-app"), { owner: "octo-org", repo: "demo-app" });
  assert.equal(originIdentity("https://gitlab.com/octo-org/demo-app.git"), null);
  assert.equal(originIdentity(""), null);
  assert.equal(toProjectName("My.Repo__Name"), "my-repo-name");
});

// Built by concatenation so this file never contains a marker line of its own.
const begin = (id) => `# ultra:${"begin"} ${id}`;
const end = (id) => `# ultra:${"end"} ${id}`;
const known = new Set(["go-service", "web"]);

test("selected blocks keep their content and lose their marker lines; the rest disappears", () => {
  const text = ["a", begin("go-service"), "go", end("go-service"), begin("web"), "web", end("web"), "z"].join("\n");
  assert.equal(applyMarkers(text, new Set(["web"]), known), "a\nweb\nz");
});

test("removing blocks between blank lines leaves a single blank line", () => {
  const text = ["a", "", begin("web"), "web", end("web"), "", begin("go-service"), "go", end("go-service"), "", "b"].join("\n");
  assert.equal(applyMarkers(text, new Set(), known), "a\n\nb");
  assert.equal(applyMarkers(text, new Set(["web"]), known), "a\n\nweb\n\nb");
});

test("template blocks are always removed", () => {
  assert.equal(applyMarkers(["a", begin("template"), "only here", end("template")].join("\n"), new Set(["web"]), known), "a");
});

test("malformed markers throw instead of deleting the rest of the file", () => {
  const cases = {
    unknown: [begin("nope"), end("nope")],
    nested: [begin("web"), begin("go-service"), end("go-service"), end("web")],
    unclosed: [begin("web"), "x"],
    mismatched: [begin("web"), end("go-service")],
  };
  for (const [name, lines] of Object.entries(cases)) {
    assert.throws(() => applyMarkers(lines.join("\n"), known, known, name), InitError, name);
  }
});

test("identity replacement never rewrites its own output", () => {
  const from = { owner: "hynix666", repo: "TEMPLATE1", name: "template1" };
  const to = { owner: "octo", repo: "hynix666-app", name: "template1-x" };
  const text = "github.com/hynix666/TEMPLATE1 module github.com/hynix666/template1 @hynix666";
  assert.equal(replaceIdentity(text, from, to), "github.com/octo/hynix666-app module github.com/octo/template1-x @octo");
});

test("an npm scope is lowercased, since npm rejects capitals, while GitHub names keep the owner's case", () => {
  const from = { owner: "hynix666", repo: "TEMPLATE1", name: "template1" };
  const to = { owner: "Acme-Corp", repo: "My.Service", name: "my-service" };
  const text = '"name": "@hynix666/template1" import "@hynix666/template1" github.com/hynix666/TEMPLATE1 * @hynix666';
  assert.equal(
    replaceIdentity(text, from, to),
    '"name": "@acme-corp/my-service" import "@acme-corp/my-service" github.com/Acme-Corp/My.Service * @Acme-Corp',
  );
});

test("identity placeholders cannot collide with ordinary text such as a digest", () => {
  const from = { owner: "hynix666", repo: "TEMPLATE1", name: "template1" };
  const to = { owner: "octo", repo: "demo-app", name: "demo-app" };
  const text = "FROM node@sha256:00000000000000001230000 # hynix666";
  assert.equal(replaceIdentity(text, from, to), "FROM node@sha256:00000000000000001230000 # octo");
});

test("selection takes exactly one of preset or features and rejects unknown names", () => {
  const manifest = loadManifest();
  assert.deepEqual([...resolveSelection(manifest, { features: "web, release" })], ["web", "release"]);
  assert.equal(resolveSelection(manifest, { preset: "minimal" }).size, 0);
  assert.throws(() => resolveSelection(manifest, {}), /exactly one/);
  assert.throws(() => resolveSelection(manifest, { preset: "all", features: "web" }), /exactly one/);
  assert.throws(() => resolveSelection(manifest, { features: "web,kubernetes" }), /Unknown feature\(s\): kubernetes/);
});

test("the default description names the product features, and says so when there are none", () => {
  const manifest = loadManifest();
  assert.equal(describeProject(manifest, new Set(["ts-service"])), "Starts as a TypeScript task API.");
  assert.equal(describeProject(manifest, new Set(["ts-service", "web", "architecture", "release"])), "Starts as a TypeScript task API and a React web app.");
  assert.equal(
    describeProject(manifest, new Set(["go-service", "py-service", "ts-library"])),
    "Starts as a Go task API, a Python task API and a TypeScript library for npm.",
  );
  // Tooling features describe how the project is built, not what it is.
  assert.match(describeProject(manifest, new Set(["architecture", "release", "devcontainer"])), /^No application code yet/);
  assert.match(describeProject(manifest, new Set()), /^No application code yet/);
});

test("a given description is one line of prose, and lands at the README anchor with no note", () => {
  assert.equal(validateDescription("  Tracks work for the support team.  "), "Tracks work for the support team.");
  for (const bad of ["", "   ", "two\nlines", "x".repeat(301), "hidden <!-- note -->"]) {
    assert.throws(() => validateDescription(bad), InitError, JSON.stringify(bad));
  }
  const readme = `# app\n\n[![verify](x)](y)\n\n${DESCRIPTION_ANCHOR}\n\n## Getting started\n`;
  assert.equal(recordDescription(readme, "Tracks work.", false), "# app\n\n[![verify](x)](y)\n\nTracks work.\n\n## Getting started\n");
  assert.match(recordDescription(readme, "Starts as a web app.", true), /\n<!-- Written by init[^\n]*-->\nStarts as a web app\.\n/);
  assert.throws(() => recordDescription("# app\n", "Tracks work.", false), /no "<!-- project description -->" line/);
});

test("identity input is validated at the boundary", () => {
  assert.deepEqual(validateIdentity({ name: "my-app", owner: "my-org" }), { name: "my-app", owner: "my-org", repo: "my-app" });
  for (const bad of [{ name: "My App", owner: "o" }, { name: "../x", owner: "o" }, { name: "ok-name", owner: "bad/owner" }, { name: "ok-name" }]) {
    assert.throws(() => validateIdentity(bad), InitError, JSON.stringify(bad));
  }
});

test("the real manifest is consistent and every marker in the tree is well formed", () => {
  const manifest = loadManifest();
  assert.deepEqual(validateManifest(manifest, (p) => existsSync(join(ROOT, p))), []);
  const ids = new Set(Object.keys(manifest.features));
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  let markers = 0;
  for (const file of tracked.filter((f) => !f.startsWith("template/") && existsSync(join(ROOT, f)))) {
    const text = readFileSync(join(ROOT, file), "utf8");
    markers += text.split("\n").filter((l) => MARKER_RE.test(l)).length;
    assert.doesNotThrow(() => applyMarkers(text, ids, ids, file));
  }
  assert.ok(markers > 0, "expected marker lines in the tree");
});

test("a path owned by two features, or inside another feature's or the template's, is rejected", () => {
  const manifest = (features, templateOnly = []) => ({ version: "1.0.0", features, templateOnly, presets: {} });
  const exists = () => true;
  assert.match(validateManifest(manifest({ a: { paths: ["svc"] }, b: { paths: ["svc"] } }), exists).join("\n"), /"svc" is owned by both "a" and "b"/);
  assert.match(validateManifest(manifest({ a: { paths: ["svc"] }, b: { paths: ["svc/x.md"] } }), exists).join("\n"), /"svc\/x\.md" is owned by both "b" and "a"/);
  assert.match(validateManifest(manifest({ a: { paths: ["template/x"] } }, ["template"]), exists).join("\n"), /"template\/x" is owned by "a" and is template-only/);
  assert.deepEqual(validateManifest(manifest({ a: { paths: ["svc"] }, b: { paths: ["svc2"] } }), exists), []);
});

test("template-test generates exactly the presets features.json defines", () => {
  const workflow = readFileSync(join(ROOT, ".github/workflows/template-test.yml"), "utf8");
  const matrix = /^\s*preset: \[([^\]]*)\]/m.exec(workflow)?.[1].split(",").map((p) => p.trim());
  assert.deepEqual(matrix, Object.keys(loadManifest().presets));
});

test("the 1.x public contract only grows: no feature or preset is removed or renamed", () => {
  // Feature ids and preset names are what adopters type, and what template-update replays from a
  // project's CHANGELOG. Taking one away breaks every project that used it, which is a major version.
  const manifest = loadManifest();
  if (!manifest.version.startsWith("1.")) return;
  const features = ["go-service", "ts-service", "py-service", "mcp-server", "web", "ts-library", "architecture", "release", "devcontainer"];
  const presets = ["minimal", "go-api", "py-api", "fullstack-ts", "library", "mcp", "all"];
  assert.deepEqual(features.filter((id) => !(id in manifest.features)), [], "features removed within 1.x");
  assert.deepEqual(presets.filter((id) => !(id in manifest.presets)), [], "presets removed within 1.x");
  for (const preset of presets.filter((id) => id !== "all")) {
    for (const feature of manifest.presets[preset]) assert.ok(manifest.presets.all.includes(feature), `${preset}: ${feature} is not in all`);
  }
});

test("every module directory scripts/modules.mjs knows is owned by exactly one feature", () => {
  const manifest = loadManifest();
  for (const module of MODULES) {
    const owners = Object.entries(manifest.features).filter(([, f]) => f.paths.includes(module.dir)).map(([id]) => id);
    assert.deepEqual(owners, [module.id], module.dir);
  }
});

test("removed paths cover unselected features and template-only files", () => {
  const removed = removedPaths(loadManifest(), new Set(["web"]));
  assert.ok(removed.includes("template") && removed.includes("services/api-go"));
  assert.ok(!removed.includes("apps/web"));
});

test("in-place init removes an unselected module whole, ignored files included", (t) => {
  const copy = mkdtempSync(join(tmpdir(), "init-inplace-"));
  t.after(() => rmSync(copy, { recursive: true, force: true }));
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  for (const file of tracked.filter((f) => existsSync(join(ROOT, f)))) {
    mkdirSync(dirname(join(copy, file)), { recursive: true });
    copyFileSync(join(ROOT, file), join(copy, file));
  }
  const git = (...args) => execFileSync("git", args, { cwd: copy, stdio: "ignore" });
  git("init", "-q");
  git("add", "-A");
  git("-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-q", "-m", "copy");
  // What the Dev Container's postCreateCommand leaves behind before init runs.
  mkdirSync(join(copy, "services/api-ts/node_modules/pkg"), { recursive: true });
  writeFileSync(join(copy, "services/api-ts/node_modules/pkg/index.js"), "");

  execFileSync("node", ["template/init.mjs", "--name", "demo-app", "--owner", "octo", "--preset", "go-api"], { cwd: copy, stdio: "pipe" });

  assert.equal(existsSync(join(copy, "services/api-ts")), false);
  assert.equal(existsSync(join(copy, "template")), false);
  assert.equal(existsSync(join(copy, "services/api-go/go.mod")), true);
});

test("without --name, the project name comes from the repository being initialized", (t) => {
  const out = join(mkdtempSync(join(tmpdir(), "init-")), "never-written");
  t.after(() => rmSync(dirname(out), { recursive: true, force: true }));
  const plan = execFileSync(
    "node",
    ["template/init.mjs", "--owner", "octo", "--repo", "My.Service", "--preset", "minimal", "--out", out, "--dry-run"],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.match(plan, /^my-service \(octo\/My\.Service\)/m);
});

test("every preset generates a project that passes its own chassis checks and documents only what it has", (t) => {
  const manifest = loadManifest();
  const base = mkdtempSync(join(tmpdir(), "presets-"));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  for (const [preset, selected] of Object.entries(manifest.presets)) {
    const out = join(base, preset);
    execFileSync("node", ["template/init.mjs", "--name", "demo-app", "--owner", "octo", "--preset", preset, "--out", out], { cwd: ROOT, stdio: "pipe" });
    execFileSync("git", ["init", "-q"], { cwd: out });
    execFileSync("git", ["add", "-A"], { cwd: out });
    for (const check of ["scripts/check-hygiene.mjs", "scripts/check-docs.mjs"]) {
      assert.doesNotThrow(() => execFileSync("node", [check], { cwd: out, stdio: "pipe" }), `${preset}: ${check}`);
    }
    const readme = readFileSync(join(out, "README.md"), "utf8");
    assert.ok(!readme.includes(DESCRIPTION_ANCHOR), `${preset}: README keeps the description anchor`);
    assert.ok(readme.includes(`\n${describeProject(manifest, new Set(selected))}\n`), `${preset}: README has no description`);
    for (const [id, feature] of Object.entries(manifest.features).filter(([id]) => !selected.includes(id))) {
      for (const path of feature.paths) {
        assert.ok(!readme.includes(`](${path}`) && !readme.includes(`\`${path}`), `${preset}: README still points at ${path} (${id})`);
      }
    }
  }
});

test("--description is written under the README title, in place of the generated sentence", (t) => {
  const out = mkdtempSync(join(tmpdir(), "init-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  rmSync(out, { recursive: true });
  const args = ["template/init.mjs", "--name", "demo-app", "--owner", "octo", "--preset", "minimal", "--description", "Tracks work for the support team.", "--out", out];
  execFileSync("node", args, { cwd: ROOT, stdio: "pipe" });
  const readme = readFileSync(join(out, "README.md"), "utf8");
  assert.match(readme, /^# demo-app\n\n\[!\[verify\][^\n]*\n\nTracks work for the support team\.\n/);
  assert.doesNotMatch(readme, /Written by init|No application code yet/);
});

test("init --out writes a project with no template residue", (t) => {
  const out = mkdtempSync(join(tmpdir(), "init-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  rmSync(out, { recursive: true });
  execFileSync("node", ["template/init.mjs", "--name", "demo-app", "--owner", "octo", "--preset", "minimal", "--out", out], { cwd: ROOT, stdio: "pipe" });
  for (const gone of ["template", "services", "apps", "architecture", ".devcontainer", ".github/workflows/template-test.yml"]) {
    assert.equal(existsSync(join(out, gone)), false, gone);
  }
  assert.match(readFileSync(join(out, "LICENSE"), "utf8"), /octo/);
  const { version } = loadManifest();
  assert.match(
    readFileSync(join(out, "CHANGELOG.md"), "utf8"),
    new RegExp(`## \\[Unreleased\\]\\n\\n- Initialized from \\[TEMPLATE1 v${version.replaceAll(".", "\\.")}\\]\\(https://github\\.com/hynix666/TEMPLATE1/releases/tag/v${version.replaceAll(".", "\\.")}\\) with no features\\.`),
  );
  assert.match(readFileSync(join(out, "README.md"), "utf8"), /^# demo-app/);
  assert.doesNotMatch(readFileSync(join(out, ".github/workflows/verify.yml"), "utf8"), /ultra:|go-service/);
});
