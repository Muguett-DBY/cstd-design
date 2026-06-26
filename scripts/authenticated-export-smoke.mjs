import { chromium } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const baseUrl = (process.env.CSTD_BASE_URL || "http://127.0.0.1:8788").replace(/\/$/, "");
const secret = process.env.E2E_SESSION_SECRET;

if (!secret) {
  console.error("E2E_SESSION_SECRET is required for authenticated export smoke.");
  process.exit(1);
}

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function detectBrowserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (process.env.BROWSER_EXECUTABLE_PATH) return process.env.BROWSER_EXECUTABLE_PATH;
  if (process.platform !== "win32") return undefined;

  return firstExisting([
    path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
  ]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertOk(response, label) {
  if (response.ok()) return;
  const body = await response.text().catch(() => "");
  throw new Error(`${label} failed: HTTP ${response.status()} ${body.slice(0, 300)}`);
}

async function postWithRetry(requestContext, url, options, label) {
  let lastResponse;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    lastResponse = await requestContext.post(url, options);
    if (lastResponse.ok() || lastResponse.status() < 500) return lastResponse;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  await assertOk(lastResponse, label);
  return lastResponse;
}

const browserExecutable = detectBrowserExecutable();
const browser = await chromium.launch({
  headless: true,
  executablePath: browserExecutable,
});

const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1366, height: 900 },
});
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
const page = await context.newPage();
await page.addInitScript(() => {
  window.localStorage.setItem("cstd-design:onboardingComplete", "true");
  window.localStorage.setItem("cstd-design:onboarding-tips", JSON.stringify(["welcome", "chat", "image", "assets", "search"]));
});
const consoleMessages = [];
page.on("console", (message) => {
  if (["warning", "error"].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => {
  consoleMessages.push(`pageerror: ${error.message}`);
});

try {
  const auth = await postWithRetry(context.request, `${baseUrl}/api/session/test`, {
    headers: { "x-cstd-e2e-secret": secret },
  }, "session seed");
  await assertOk(auth, "session seed");

  const fixture = await postWithRetry(context.request, `${baseUrl}/api/session/test/fixture`, {
    headers: { "x-cstd-e2e-secret": secret },
    data: { label: `smoke-${Date.now()}` },
  }, "conversation fixture seed");
  await assertOk(fixture, "conversation fixture seed");
  const fixtureBody = await fixture.json();
  const title = fixtureBody.conversation?.title;
  if (!title) throw new Error("fixture response did not include a conversation title");

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".app-shell").waitFor({ timeout: 20_000 });

  const conversationButton = page.getByRole("button", { name: new RegExp(escapeRegExp(title)) }).first();
  await conversationButton.waitFor({ timeout: 15_000 });
  await conversationButton.click();

  await page.getByText("这是用于高级导出浏览器冒烟的固定回复").first().waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "高级导出", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "导出对话" });
  await dialog.waitFor({ timeout: 10_000 });
  await dialog.getByText("2 条消息将被导出").waitFor({ timeout: 10_000 });
  await dialog.getByText(/E2E 导出验证.*\.md/).waitFor({ timeout: 10_000 });

  await dialog.getByRole("button", { name: "预览导出内容" }).click();
  await dialog.getByText("这是用于高级导出浏览器冒烟的固定回复").first().waitFor({ timeout: 10_000 });

  await dialog.getByRole("button", { name: /PDF/ }).click();
  await dialog.getByText(/E2E 导出验证.*\.pdf/).waitFor({ timeout: 10_000 });

  await dialog.getByRole("button", { name: /Markdown/ }).click();
  await dialog.getByText(/E2E 导出验证.*\.md/).waitFor({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "复制内容" }).click();
  await dialog.getByText("已复制当前导出内容。").waitFor({ timeout: 10_000 });
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  if (!clipboardText.includes("这是用于高级导出浏览器冒烟的固定回复")) {
    throw new Error("expected copied export content to include the seeded assistant response");
  }

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  const overlayCount = await page.locator("text=/Failed to load resource|Internal Server Error|Unhandled Runtime Error/").count();
  if (horizontalOverflow) throw new Error("page has horizontal overflow after export smoke");
  if (overlayCount > 0) throw new Error("framework/runtime error overlay text was found");
  if (consoleMessages.length > 0) throw new Error(`console warnings/errors detected:\n${consoleMessages.join("\n")}`);

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    browser: browserExecutable || "playwright-default",
    conversationTitle: title,
    copyVerified: true,
    platform: `${os.platform()} ${os.release()}`,
  }, null, 2));
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
