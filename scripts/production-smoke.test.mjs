import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  REQUIRED_PAGE_SECRETS,
  findMissingPageSecrets,
  runProductionSmoke,
  selectDeploymentForCommit,
} from "./production-smoke-lib.mjs";
import { runWrangler } from "./wrangler-command.mjs";

test("runWrangler launches the local CLI without a platform shell wrapper", () => {
  assert.match(runWrangler(["--version"]), /^4\./);
});

test("findMissingPageSecrets reports required production bindings without exposing values", () => {
  const output = `
    - APP_PASSWORD_HASH: Value Encrypted
    - SESSION_SECRET: Value Encrypted
    - LOGIN_HASH_SECRET: Value Encrypted
  `;

  assert.deepEqual(findMissingPageSecrets(output), [
    "ASSET_CAPABILITY_SECRET",
    "UPSTREAM_API_KEY",
  ]);
  assert.ok(REQUIRED_PAGE_SECRETS.includes("APP_PASSWORD_HASH"));
});

test("Pages deploy commands explicitly acknowledge build-output dirty state", () => {
  const workflow = readFileSync(".github/workflows/pages.yml", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

  assert.match(
    workflow,
    /wrangler pages deploy dist\b[^\n]*--commit-dirty=true/,
    "GitHub Actions deploy should avoid Wrangler's ambiguous dirty-worktree warning",
  );
  assert.match(
    packageJson.scripts["pages:deploy"],
    /wrangler pages deploy dist\b.*--commit-dirty=true/,
    "local Pages deploy script should use the same explicit dirty-worktree contract",
  );
});

test("authenticated startup does not schedule a redundant conversation refresh", () => {
  const app = readFileSync("src/App.tsx", "utf8");

  assert.doesNotMatch(
    app,
    /setTimeout\(\(\) => refreshConversations\(""\)/,
    "the session bootstrap already loads conversations and must remain the only startup refresh",
  );
});

test("Linux CI installs the Workerd platform binary required by Wrangler", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const linuxWorkerdVersion = packageLock.packages["node_modules/workerd"]?.optionalDependencies?.["@cloudflare/workerd-linux-64"];

  assert.equal(
    packageJson.optionalDependencies?.["@cloudflare/workerd-linux-64"],
    linuxWorkerdVersion,
    "GitHub's Ubuntu runner must install workerd's Linux x64 binary as a root optional dependency",
  );
  assert.equal(
    packageLock.packages[""]?.optionalDependencies?.["@cloudflare/workerd-linux-64"],
    linuxWorkerdVersion,
    "package-lock root metadata should preserve the explicit CI platform binary",
  );
});

test("selectDeploymentForCommit returns the exact production deployment", () => {
  const deployments = [
    { Environment: "Production", Source: "abc1234", Deployment: "https://abc1234.example.pages.dev" },
    { Environment: "Preview", Source: "def5678", Deployment: "https://def5678.example.pages.dev" },
  ];

  assert.equal(
    selectDeploymentForCommit(deployments, "abc1234567890").Deployment,
    "https://abc1234.example.pages.dev",
  );
  assert.throws(() => selectDeploymentForCommit(deployments, "missing"), /deployment not found/i);
});

test("runProductionSmoke verifies the public shell and production auth boundary", async () => {
  const calls = [];
  const responses = new Map([
    ["GET /", new Response("<title>工作台 - 私人中文创作工作台</title>", { status: 200 })],
    ["GET /api/session", Response.json({ authenticated: false, expiresAt: null })],
    ["GET /api/conversations", Response.json({ error: "请先登录。" }, { status: 401 })],
    ["POST /api/session/test", Response.json({ error: "测试会话未启用。" }, { status: 404 })],
  ]);
  const fetcher = async (url, init = {}) => {
    const key = `${init.method || "GET"} ${new URL(url).pathname}`;
    calls.push(key);
    return responses.get(key).clone();
  };

  const result = await runProductionSmoke("https://deployment.example", fetcher);

  assert.deepEqual(calls, [
    "GET /",
    "GET /api/session",
    "GET /api/conversations",
    "POST /api/session/test",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.authBoundaryVerified, true);
});

test("runProductionSmoke retries while Pages Functions are still propagating", async () => {
  let sessionAttempts = 0;
  const fetcher = async (url, init = {}) => {
    const key = `${init.method || "GET"} ${new URL(url).pathname}`;
    if (key === "GET /") {
      return new Response("<title>工作台 - 私人中文创作工作台</title>", { status: 200 });
    }
    if (key === "GET /api/session") {
      sessionAttempts += 1;
      if (sessionAttempts === 1) {
        return new Response("Functions deployment is not ready", { status: 404 });
      }
      return Response.json({ authenticated: false, expiresAt: null });
    }
    if (key === "GET /api/conversations") {
      return Response.json({ error: "请先登录。" }, { status: 401 });
    }
    if (key === "POST /api/session/test") {
      return Response.json({ error: "测试会话未启用。" }, { status: 404 });
    }
    throw new Error(`Unexpected request: ${key}`);
  };

  const result = await runProductionSmoke("https://deployment.example", fetcher);

  assert.equal(result.ok, true);
  assert.equal(sessionAttempts, 2);
});
