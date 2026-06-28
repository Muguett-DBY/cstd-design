import { spawnSync } from "node:child_process";
import path from "node:path";

export function runWrangler(args) {
  const entrypoint = path.join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `Wrangler exited with status ${result.status}.`);
  }
  return result.stdout;
}
