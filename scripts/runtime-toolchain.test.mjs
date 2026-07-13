import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, rootUrl), "utf8"));
}

function readTomlValue(source, section, key) {
  let activeSection = section === null;

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.replace(/#.*$/u, "").trim();
    const sectionMatch = /^\[([^\]]+)\]$/u.exec(line);
    if (sectionMatch) {
      activeSection = sectionMatch[1] === section;
      continue;
    }
    if (!activeSection) continue;

    const assignment = /^([^=]+?)\s*=\s*(.+)$/u.exec(line);
    if (assignment?.[1].trim() === key) return assignment[2].trim();
  }

  return undefined;
}

test("Linux workerd pin and install approval match Wrangler's runtime", async () => {
  const [manifest, lockfile, wranglerManifest] = await Promise.all([
    readJson("package.json"),
    readJson("package-lock.json"),
    readJson("node_modules/wrangler/package.json"),
  ]);
  const requiredWorkerd = wranglerManifest.dependencies?.workerd;

  assert.match(requiredWorkerd, /^1\.\d+\.\d+$/u);
  assert.equal(manifest.optionalDependencies?.["@cloudflare/workerd-linux-64"], requiredWorkerd);
  assert.equal(lockfile.packages?.[""]?.optionalDependencies?.["@cloudflare/workerd-linux-64"], requiredWorkerd);
  assert.equal(lockfile.packages?.["node_modules/workerd"]?.version, requiredWorkerd);
  assert.equal(lockfile.packages?.["node_modules/@cloudflare/workerd-linux-64"]?.version, requiredWorkerd);

  const workerdApprovals = Object.entries(manifest.allowScripts ?? {}).filter(([name]) => name.startsWith("workerd@"));
  assert.deepEqual(workerdApprovals, [[`workerd@${requiredWorkerd}`, true]]);
});

test("Pages config disables supported telemetry and omits Workers-only instrumentation", async () => {
  const config = await readFile(new URL("wrangler.toml", rootUrl), "utf8");

  assert.equal(readTomlValue(config, null, "send_metrics"), "false");
  assert.equal(readTomlValue(config, "dependencies_instrumentation", "enabled"), undefined);
});
