/**
 * Release notes for a template release, written for the people who will take it into a project.
 *
 * GitHub's generated notes list pull request titles, which say what changed in this repository. An
 * adopter needs something else: which files change in a project generated from the template, grouped
 * by the feature that owns them, so they can tell at a glance whether a release touches anything they
 * selected. Template-only files are listed apart, because no project ever has them, and so is a shared
 * file whose change lies entirely inside its `template` blocks, because init deletes those.
 *
 *   node template/release-notes.mjs --to v1.4.1                 # since the previous release tag
 *   node template/release-notes.mjs --to v1.4.1 --from v1.3.0
 *
 * Template-only: init deletes it, with the rest of template/.
 */
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { isUnder, loadManifest, MARKER_RE, ROOT, TEMPLATE_ONLY_ID } from "./init.mjs";

const CHASSIS = "Every project";

/** A shared file as far as projects are concerned: init deletes its `template` blocks, markers included. */
export function withoutTemplateBlocks(text) {
  const kept = [];
  let inside = false;
  for (const line of text.split("\n")) {
    const marker = MARKER_RE.exec(line);
    if (marker?.[2] === TEMPLATE_ONLY_ID) inside = marker[1] === "begin";
    else if (!inside) kept.push(line);
  }
  return kept.join("\n");
}

/**
 * Sorts `git diff --name-status` entries into template-only files and, per owning feature, the rest.
 * `changedOnlyInTemplateBlocks(path)` says whether a modified shared file differs only inside its
 * `template` blocks; such a file is listed as template-only too, because no project receives the change.
 */
export function classify(entries, manifest, changedOnlyInTemplateBlocks = () => false) {
  // Every project first, then features in the order features.json lists them; empty groups are dropped.
  const shipped = new Map([CHASSIS, ...Object.keys(manifest.features)].map((owner) => [owner, []]));
  const templateOnly = [];
  const templateBlocks = [];
  for (const [status, path] of entries) {
    if (manifest.templateOnly.some((only) => isUnder(path, only))) {
      templateOnly.push(`${status} ${path}`);
      continue;
    }
    if (status === "M" && changedOnlyInTemplateBlocks(path)) {
      templateBlocks.push(`${status} ${path}`);
      continue;
    }
    const owner = Object.entries(manifest.features).find(([, feature]) => feature.paths.some((p) => isUnder(path, p)))?.[0] ?? CHASSIS;
    shipped.get(owner).push(`${status} ${path}`);
  }
  for (const [owner, files] of shipped) if (files.length === 0) shipped.delete(owner);
  return { shipped, templateOnly, templateBlocks };
}

export function render({ to, from, shipped, templateOnly, templateBlocks = [], pullRequests = "" }) {
  const lines = [`Changes since ${from}.`, "", "## What changes in generated projects", ""];
  if (shipped.size === 0) lines.push("Nothing: every change in this release is template-only.", "");
  for (const [owner, files] of shipped) {
    lines.push(`### ${owner === CHASSIS ? owner : `With \`${owner}\``}`, "", ...files.map((f) => `- \`${f}\``), "");
  }
  lines.push(
    "Shared files such as `README.md` and the workflows carry marker blocks, so a change listed under *Every project* may only reach projects that selected the feature it belongs to.",
    "",
    "## Taking it into a project",
    "",
    "```bash",
    `node scripts/template-update.mjs --to ${to} --dry-run`,
    `node scripts/template-update.mjs --to ${to}`,
    "```",
    "",
    "A project generated before v1.4.0 runs the script once from a clone of the template, with the project as its working directory.",
    "",
  );
  if (templateOnly.length + templateBlocks.length > 0) {
    lines.push(
      "## Template only",
      "",
      "No generated project has these files, or these parts of them.",
      "",
      ...templateOnly.map((f) => `- \`${f}\``),
      ...templateBlocks.map((f) => `- \`${f}\`: only its \`template\` block, which init deletes`),
      "",
    );
  }
  if (pullRequests.trim() !== "") lines.push(pullRequests.trim(), "");
  return lines.join("\n");
}

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

function main() {
  const { values } = parseArgs({ options: { to: { type: "string" }, from: { type: "string" }, repo: { type: "string" } } });
  if (!/^v\d+\.\d+\.\d+$/.test(values.to ?? "")) throw new Error(`--to must be a version tag such as v1.4.1, got "${values.to ?? ""}"`);
  const from = values.from ?? git("describe", "--tags", "--abbrev=0", "--match", "v*", "HEAD");
  const entries = git("diff", "--no-renames", "--name-status", from, "HEAD").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("\t")), l.slice(l.indexOf("\t") + 1)]);
  let pullRequests = "";
  if (values.repo) {
    // GitHub's own list of merged pull requests, appended so the notes carry both views.
    // The tag does not exist yet when this runs, so the API needs the commit it will point at.
    const fields = [`tag_name=${values.to}`, `target_commitish=${git("rev-parse", "HEAD")}`, `previous_tag_name=${from}`];
    pullRequests = execFileSync("gh", ["api", `repos/${values.repo}/releases/generate-notes`, ...fields.flatMap((f) => ["-f", f]), "--jq", ".body"], { encoding: "utf8" });
  }
  const onlyTemplateBlocks = (path) => withoutTemplateBlocks(git("show", `${from}:${path}`)) === withoutTemplateBlocks(git("show", `HEAD:${path}`));
  process.stdout.write(render({ to: values.to, from, ...classify(entries, loadManifest(), onlyTemplateBlocks), pullRequests }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
