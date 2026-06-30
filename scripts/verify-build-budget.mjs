import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const assetsDir = join(distDir, "assets");
const initialChunkLimitKiB = 600;
const lazyChunkLimitKiB = 600;
const reviewedLazyChunkAllowlist = [
  {
    pattern: /^chunk-KEIR6QF5-.*\.js$/,
    limitKiB: 700,
    reason: "Mermaid parser core is loaded only after a Mermaid markdown block requests rendering.",
  },
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function chunkSizeKiB(fileName) {
  return statSync(join(assetsDir, fileName)).size / 1024;
}

function listJsChunks() {
  if (!existsSync(assetsDir)) {
    throw new Error("Missing dist/assets. Run vite build before verifying chunk budgets.");
  }
  return readdirSync(assetsDir).filter((fileName) => fileName.endsWith(".js"));
}

function getEntryChunk() {
  const htmlPath = join(distDir, "index.html");
  if (!existsSync(htmlPath)) {
    throw new Error("Missing dist/index.html. Run vite build before verifying chunk budgets.");
  }

  const html = readText(htmlPath);
  const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="\/assets\/([^"]+\.js)"/);
  if (!entryMatch) {
    throw new Error("Could not find the module entry script in dist/index.html.");
  }
  return entryMatch[1];
}

function extractStaticImports(source) {
  const imports = new Set();
  const bareImportPattern = /import\s*["']\.\/([^"']+\.js)["']/g;
  const namedImportPattern = /import\s+[^;"']+?\s+from\s*["']\.\/([^"']+\.js)["']/g;

  for (const pattern of [bareImportPattern, namedImportPattern]) {
    for (const match of source.matchAll(pattern)) {
      imports.add(match[1]);
    }
  }

  return [...imports];
}

function collectInitialChunks(entryChunk) {
  const initialChunks = new Set();
  const stack = [entryChunk];

  while (stack.length > 0) {
    const chunk = stack.pop();
    if (!chunk || initialChunks.has(chunk)) continue;
    initialChunks.add(chunk);

    const chunkPath = join(assetsDir, chunk);
    if (!existsSync(chunkPath)) continue;

    for (const dependency of extractStaticImports(readText(chunkPath))) {
      stack.push(dependency);
    }
  }

  return initialChunks;
}

function reviewedLazyLimit(fileName) {
  return reviewedLazyChunkAllowlist.find((entry) => entry.pattern.test(fileName));
}

const jsChunks = listJsChunks();
const entryChunk = getEntryChunk();
const initialChunks = collectInitialChunks(entryChunk);
const failures = [];
const reviewed = [];

for (const chunk of jsChunks) {
  const sizeKiB = chunkSizeKiB(chunk);
  const isInitial = initialChunks.has(chunk);
  const defaultLimit = isInitial ? initialChunkLimitKiB : lazyChunkLimitKiB;
  const allowlistEntry = isInitial ? undefined : reviewedLazyLimit(chunk);
  const limitKiB = allowlistEntry?.limitKiB ?? defaultLimit;

  if (sizeKiB > limitKiB) {
    failures.push(`${chunk}: ${sizeKiB.toFixed(2)} KiB exceeds ${limitKiB} KiB ${isInitial ? "initial" : "lazy"} limit`);
  } else if (allowlistEntry && sizeKiB > lazyChunkLimitKiB) {
    reviewed.push(`${chunk}: ${sizeKiB.toFixed(2)} KiB reviewed exception (${allowlistEntry.reason})`);
  }
}

if (failures.length > 0) {
  console.error("Build chunk budget failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Build chunk budget passed: ${initialChunks.size} initial JS chunk(s) <= ${initialChunkLimitKiB} KiB, lazy JS chunks <= ${lazyChunkLimitKiB} KiB except reviewed parser allowance.`,
);
for (const item of reviewed) {
  console.log(`- ${item}`);
}
