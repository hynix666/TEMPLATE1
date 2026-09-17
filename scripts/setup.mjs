/**
 * Installs the dependencies of every module present: `npm ci` where a lockfile exists (the exact
 * tree CI installs), `npm install` where one does not yet, `go mod download` for Go, and
 * `uv sync --frozen` for Python — each the command that installs exactly what the lockfile says.
 *
 * Exit 0 all installed · 1 an install failed.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { presentModules, ROOT, run } from "./modules.mjs";

let failed = 0;
for (const module of presentModules()) {
  const cwd = join(ROOT, module.dir);
  const [command, args] = module.toolchain === "go"
    ? ["go", ["mod", "download"]]
    : module.toolchain === "python"
    ? ["uv", ["sync", existsSync(join(cwd, "uv.lock")) ? "--frozen" : "--no-frozen"]]
    : ["npm", [existsSync(join(cwd, "package-lock.json")) ? "ci" : "install"]];
  console.log(`\n▶ ${module.id}: ${command} ${args.join(" ")}`);
  if (run(command, args, { cwd }).status !== 0) {
    failed++;
    console.error(`setup: ${module.id} failed to install.`);
  }
}
if (failed === 0) console.log("\nsetup: OK — next, node scripts/verify.mjs");
process.exitCode = failed === 0 ? 0 : 1;
