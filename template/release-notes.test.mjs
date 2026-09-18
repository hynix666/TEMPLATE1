import assert from "node:assert/strict";
import { test } from "node:test";
import { loadManifest } from "./init.mjs";
import { classify, render, withoutTemplateBlocks } from "./release-notes.mjs";

const manifest = loadManifest();

test("files are grouped by the feature that owns them, and template-only files are kept apart", () => {
  const { shipped, templateOnly } = classify(
    [
      ["M", "README.md"],
      ["A", "services/api-py/src/api_py/new.py"],
      ["M", "services/api-go/go.mod"],
      ["M", "template/init.mjs"],
      ["M", ".github/workflows/template-test.yml"],
    ],
    manifest,
  );
  // Every project first, then the order features.json lists features in, not the order files came in.
  assert.deepEqual([...shipped.keys()], ["Every project", "go-service", "py-service"]);
  assert.deepEqual(shipped.get("py-service"), ["A services/api-py/src/api_py/new.py"]);
  assert.deepEqual(templateOnly, ["M template/init.mjs", "M .github/workflows/template-test.yml"]);
});

test("the notes say what reaches projects, how to take it, and what does not", () => {
  const notes = render({ to: "v9.9.9", from: "v9.9.8", ...classify([["M", "SECURITY.md"], ["M", "template/README.md"]], manifest) });
  assert.match(notes, /## What changes in generated projects\n\n### Every project\n\n- `M SECURITY\.md`/);
  assert.match(notes, /template-update\.mjs --to v9\.9\.9 --dry-run/);
  assert.match(notes, /## Template only[\s\S]*`M template\/README\.md`/);
});

test("a shared file changed only inside its template block is template-only; any other change ships", () => {
  const readme = (intro, layout) => [
    "# Project",
    "<!-- ultra:begin template -->",
    intro,
    "<!-- ultra:end template -->",
    "<!-- ultra:begin go-service -->",
    layout,
    "<!-- ultra:end go-service -->",
  ].join("\n");
  const before = readme("Presets, then features.", "- services/api-go/");
  assert.equal(withoutTemplateBlocks(before), withoutTemplateBlocks(readme("Features, then presets.", "- services/api-go/")));
  assert.notEqual(withoutTemplateBlocks(before), withoutTemplateBlocks(readme("Presets, then features.", "- services/api-go/ (Go)")));
  // Feature markers stay: moving content from one feature's block to another's changes what projects get.
  assert.match(withoutTemplateBlocks(before), /ultra:begin go-service/);

  const { shipped, templateOnly, templateBlocks } = classify([["M", "README.md"], ["M", "SECURITY.md"]], manifest, (path) => path === "README.md");
  assert.deepEqual(templateBlocks, ["M README.md"]);
  assert.deepEqual(templateOnly, []);
  assert.deepEqual(shipped.get("Every project"), ["M SECURITY.md"]);
  const notes = render({ to: "v9.9.9", from: "v9.9.8", shipped, templateOnly, templateBlocks });
  assert.match(notes, /## Template only[\s\S]*- `M README\.md`: only its `template` block, which init deletes/);
  assert.doesNotMatch(notes, /### Every project\n\n- `M README\.md`/);
});

test("a release that changes nothing projects have says so", () => {
  const notes = render({ to: "v9.9.9", from: "v9.9.8", ...classify([["M", "template/ANALYSIS.md"]], manifest) });
  assert.match(notes, /Nothing: every change in this release is template-only\./);
});
