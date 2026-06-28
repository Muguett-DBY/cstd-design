import assert from "node:assert/strict";
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
