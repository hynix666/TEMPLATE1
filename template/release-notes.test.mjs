import assert from "node:assert/strict";
import { test } from "node:test";
import { loadManifest } from "./init.mjs";
import { classify, render } from "./release-notes.mjs";

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

test("a release that changes nothing projects have says so", () => {
  const notes = render({ to: "v9.9.9", from: "v9.9.8", ...classify([["M", "template/ANALYSIS.md"]], manifest) });
  assert.match(notes, /Nothing: every change in this release is template-only\./);
});
