import { execFileSync } from "node:child_process";
import { runProductionSmoke, selectDeploymentForCommit } from "./production-smoke-lib.mjs";
import { runWrangler } from "./wrangler-command.mjs";

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function resolveBaseUrl(commitSha) {
  if (process.env.CSTD_BASE_URL) return process.env.CSTD_BASE_URL;
  const output = runWrangler([
    "pages",
    "deployment",
    "list",
    "--project-name",
    "cstd-design",
    "--environment",
    "production",
    "--json",
  ]);
  return selectDeploymentForCommit(JSON.parse(output), commitSha).Deployment;
}

const commitSha = process.env.CSTD_COMMIT_SHA || currentCommit();
const result = await runProductionSmoke(resolveBaseUrl(commitSha));
console.log(JSON.stringify({ ...result, commitSha }, null, 2));
