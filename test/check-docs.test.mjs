// Every rule gets a case that must fire and the clean fixture that must not. A checker with only
// the passing case proves nothing: it passes just as well when the rule is broken.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { checkDocs, frontmatter, IMPORT_TEXT, linksTo, MAX_POINTER_LINES, MAX_SKILL_DESCRIPTION } from "../scripts/check-docs.mjs";

const skill = (name, description = "When to use it.") => `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;

const CLEAN = {
  "AGENTS.md": "# AGENTS.md\n\nHow to work here.\n",
  "CLAUDE.md": IMPORT_TEXT,
  "GEMINI.md": "See [AGENTS.md](AGENTS.md).\n",
  ".github/copilot-instructions.md": "See [AGENTS.md](../AGENTS.md).\n",
  ".claude/skills/record-decision/SKILL.md": skill("record-decision"),
  "docs/README.md": "# Documentation\n\n- [Decisions](adr/README.md)\n- [Runbook](./runbook.md)\n",
  "docs/runbook.md": "# Runbook\n",
  "docs/adr/README.md": "# Decisions\n\n| [0001](0001-first.md) | Accepted |\n",
  "docs/adr/0001-first.md": "# First\n",
};

function fixture(t, changes = {}) {
  const root = mkdtempSync(join(tmpdir(), "docs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, content] of Object.entries({ ...CLEAN, ...changes })) {
    if (content === null) continue; // a file the case removes
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  execFileSync("git", ["init", "-q"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["add", "-A", "--force"], { cwd: root, stdio: "ignore" });
  return root;
}

const failures = (t, changes) => checkDocs(fixture(t, changes)).failures.join("\n");

test("a repository whose documentation is in order passes", (t) => {
  const result = checkDocs(fixture(t));
  assert.equal(result.ok, true, result.failures?.join("\n"));
  assert.equal(result.skillCount, 1);
  assert.equal(result.docCount, 4);
});

test("outside a git repository the checker says so instead of passing", (t) => {
  const root = mkdtempSync(join(tmpdir(), "docs-nogit-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = checkDocs(root);
  assert.equal(result.ok, false);
  assert.match(result.fatal, /git repository/);
});

test("the instructions are one file: missing, empty or duplicated all fail", (t) => {
  assert.match(failures(t, { "AGENTS.md": null }), /AGENTS\.md` is missing/);
  assert.match(failures(t, { "AGENTS.md": "\n \n" }), /AGENTS\.md` is empty/);
  assert.match(failures(t, { "services/api/AGENTS.md": "# local rules\n" }), /services\/api\/AGENTS\.md.*drifts/s);
});

test("CLAUDE.md must be the import line and nothing else", (t) => {
  assert.match(failures(t, { "CLAUDE.md": `${IMPORT_TEXT}\nAlso: never run the tests.\n` }), /CLAUDE\.md` must be exactly/);
  assert.match(failures(t, { "CLAUDE.md": null }), /CLAUDE\.md` is missing/);
  // A Windows checkout writes CRLF; the file still says exactly the same thing.
  assert.equal(checkDocs(fixture(t, { "CLAUDE.md": IMPORT_TEXT.replace("\n", "\r\n") })).ok, true);
});

test("a vendor pointer that carries its own instructions fails", (t) => {
  assert.match(failures(t, { "GEMINI.md": "Build with npm, deploy on Fridays.\n" }), /GEMINI\.md` never names AGENTS\.md/);
  assert.match(failures(t, { ".github/copilot-instructions.md": null }), /copilot-instructions\.md` is missing/);
  const long = `See [AGENTS.md](AGENTS.md).\n${"filler\n".repeat(MAX_POINTER_LINES)}`;
  assert.match(failures(t, { "GEMINI.md": long }), new RegExp(`over ${MAX_POINTER_LINES}`));
});

test("a skill is selectable: frontmatter, a name matching its directory, a description", (t) => {
  assert.match(failures(t, { ".claude/skills/record-decision/SKILL.md": "# Record a decision\n" }), /has no frontmatter/);
  assert.match(failures(t, { ".claude/skills/record-decision/SKILL.md": skill("record_decision") }), /declares name `record_decision`/);
  // The only skill in this case, because a case-insensitive filesystem would merge it with the clean one.
  assert.match(
    failures(t, { ".claude/skills/record-decision/SKILL.md": null, ".claude/skills/Record_Decision/SKILL.md": skill("Record_Decision") }),
    /must be lowercase words/,
  );
  assert.match(failures(t, { ".claude/skills/record-decision/SKILL.md": "---\nname: record-decision\n---\n" }), /has no description/);
  assert.match(
    failures(t, { ".claude/skills/record-decision/SKILL.md": skill("record-decision", "x".repeat(MAX_SKILL_DESCRIPTION + 1)) }),
    new RegExp(`over the ${MAX_SKILL_DESCRIPTION}`),
  );
  assert.match(failures(t, { ".claude/skills/record-decision/reference.md": "# notes\n", ".claude/skills/record-decision/SKILL.md": null }), /has no SKILL\.md/);
  assert.match(failures(t, { "docs/SKILL.md": skill("docs") }), /outside `\.claude\/skills/);
});

test("a document nothing links to fails, at either level", (t) => {
  assert.match(failures(t, { "docs/queues.md": "# Queues\n" }), /docs\/README\.md` does not link `queues\.md`/);
  assert.match(failures(t, { "docs/adr/0002-second.md": "# Second\n" }), /docs\/adr\/README\.md` does not link `0002-second\.md`/);
  assert.match(failures(t, { "docs/README.md": "# Documentation\n\n- [Runbook](runbook.md)\n" }), /does not link `adr\/README\.md`/);
  assert.match(failures(t, { "docs/adr/README.md": null }), /docs\/adr\/` has no README\.md/);
});

test("a repository with no docs directory is not a failure", (t) => {
  const result = checkDocs(fixture(t, { "docs/README.md": null, "docs/runbook.md": null, "docs/adr/README.md": null, "docs/adr/0001-first.md": null }));
  assert.equal(result.ok, true, result.failures?.join("\n"));
  assert.equal(result.docCount, 0);
});

test("frontmatter and link matching read what they claim to read", () => {
  assert.deepEqual(frontmatter('---\nname: a-b\ndescription: "Quoted: with a colon."\n---\nbody\n'), { name: "a-b", description: "Quoted: with a colon." });
  assert.equal(frontmatter("# no frontmatter\n"), null);
  assert.equal(frontmatter("---\nname: unterminated\n"), null);
  assert.equal(linksTo("see [x](./adr/README.md)", "adr/README.md"), true);
  // A longer path ending in the target is a different document.
  assert.equal(linksTo("see [x](old-runbook.md)", "runbook.md"), false);
});
