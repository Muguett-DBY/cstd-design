import { describe, expect, test } from "vitest";
import { authorizeE2ESessionRequest, requireConfiguredSecrets, requireUpstreamApiKey, sessionCookieShouldBeSecure, type Env } from "./http";
import {
  createPasswordHash,
  createSessionCookie,
  hashClientFingerprint,
  nextThrottleState,
  verifyPasswordHash,
} from "./security";
import { buildActiveBranch, type ChatMessageNode } from "./chat-tree";
import { selectMessagesForContext } from "./context";
import {
  contentDisposition,
  createAssetCapabilityToken,
  createObjectKey,
  guardRemoteAssetResponse,
  publicFilename,
  safeMediaType,
  sanitizeFilename,
  verifyAssetCapabilityToken,
  validateUpload,
} from "./media";
import {
  buildChatCompletionPayload,
  buildImageGenerationPayload,
  buildVideoCreationPayload,
  normalizeProviderError,
  normalizeVideoTask,
  sanitizeAssistantContent,
  toClientError,
} from "./provider";
import {
  ChatRequestSchema,
  CreateThreadReplySchema,
  ImageRequestSchema,
  parseRequest,
  UpdateThreadReplySchema,
  VideoRequestSchema,
} from "./validation";
import { assetKindsForClearScope, chatTablesForClearScope, normalizeClearScope } from "./clear";
import { buildE2EExportFixture } from "./e2e-fixtures";
import { AgnesClient } from "./agnes";

describe("security", () => {
  test("returns a controlled configuration error for missing auth secrets", async () => {
    const response = requireConfiguredSecrets({
      APP_PASSWORD_HASH: "hash",
      SESSION_SECRET: "",
      LOGIN_HASH_SECRET: "",
      ASSET_CAPABILITY_SECRET: "asset-secret",
    } as Env, ["APP_PASSWORD_HASH", "SESSION_SECRET", "LOGIN_HASH_SECRET"]);

    expect(response?.status).toBe(500);
    await expect(response?.json()).resolves.toEqual({ error: "服务配置缺失，请检查后台环境变量。" });
  });

  test("returns a controlled configuration error when upstream API key is missing", async () => {
    const result = requireUpstreamApiKey({ UPSTREAM_API_KEY: "", AGNES_API_KEY: "" } as Env);

    expect(result.apiKey).toBe("");
    expect(result.response?.status).toBe(500);
    await expect(result.response?.json()).resolves.toEqual({ error: "服务配置缺失，请检查后台环境变量。" });
  });

  test("hashes passwords with salt and verifies only the original value", async () => {
    const hash = await createPasswordHash("correct horse", "fixed-salt", 100_000);

    expect(hash).toMatch(/^pbkdf2-sha256\$/);
    await expect(verifyPasswordHash("correct horse", hash)).resolves.toBe(true);
    await expect(verifyPasswordHash("wrong", hash)).resolves.toBe(false);
  });

  test("creates a one-year secure session cookie", () => {
    const cookie = createSessionCookie("session-id", "token-value", true);

    expect(cookie).toContain("cstd_design_session=session-id.token-value");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=31536000");
  });

  test("keeps session cookies secure except for local http browser automation", () => {
    expect(sessionCookieShouldBeSecure(new Request("https://cstd-design.pages.dev/api/session"))).toBe(true);
    expect(sessionCookieShouldBeSecure(new Request("http://127.0.0.1:8793/api/session"))).toBe(false);
    expect(sessionCookieShouldBeSecure(new Request("http://localhost:8793/api/session"))).toBe(false);
    expect(sessionCookieShouldBeSecure(new Request("http://example.com/api/session"))).toBe(true);
  });

  test("silently throttles repeated failed logins by hashed fingerprint", async () => {
    const fingerprint = await hashClientFingerprint("203.0.113.10", "secret");
    const first = nextThrottleState(null, 1_000, fingerprint);
    const second = nextThrottleState(first, 2_000, fingerprint);
    const third = nextThrottleState(second, 3_000, fingerprint);

    expect(fingerprint).not.toContain("203.0.113.10");
    expect(first.allowedAt).toBe(1_000);
    expect(second.allowedAt).toBeGreaterThan(2_000);
    expect(third.allowedAt).toBeGreaterThan(second.allowedAt);
  });

  test("keeps the e2e session endpoint disabled unless its dedicated secret matches", async () => {
    const request = new Request("https://example.test/api/session/test", {
      method: "POST",
      headers: { "x-cstd-e2e-secret": "correct-secret" },
    });

    const disabled = authorizeE2ESessionRequest(request, {} as Env);
    expect(disabled?.status).toBe(404);
    await expect(disabled?.json()).resolves.toEqual({ error: "测试会话未启用。" });

    const denied = authorizeE2ESessionRequest(request, { E2E_SESSION_SECRET: "different-secret" } as Env);
    expect(denied?.status).toBe(403);
    await expect(denied?.json()).resolves.toEqual({ error: "测试会话未授权。" });

    expect(authorizeE2ESessionRequest(request, { E2E_SESSION_SECRET: "correct-secret" } as Env)).toBeNull();
  });
});

describe("chat tree and context", () => {
  test("builds a deterministic e2e export fixture conversation", () => {
    const fixture = buildE2EExportFixture();

    expect(fixture.title).toMatch(/^E2E 导出验证/);
    expect(fixture.messages).toHaveLength(2);
    expect(fixture.messages[0]).toMatchObject({
      role: "user",
      content: expect.stringContaining("高级导出"),
    });
    expect(fixture.messages[1]).toMatchObject({
      role: "assistant",
      content: expect.stringContaining("浏览器冒烟"),
    });
  });

  test("builds the selected message branch without destroying sibling branches", () => {
    const messages: ChatMessageNode[] = [
      { id: "u1", role: "user", content: "原问题", createdAt: "1" },
      { id: "a1", role: "assistant", content: "旧回答", parentId: "u1", createdAt: "2" },
      { id: "u2", role: "user", content: "编辑后的问题", parentId: "u1", createdAt: "3" },
      { id: "a2", role: "assistant", content: "新回答", parentId: "u2", createdAt: "4" },
    ];

    expect(buildActiveBranch(messages, "a2").map((message) => message.id)).toEqual(["u1", "u2", "a2"]);
    expect(buildActiveBranch(messages, "a1").map((message) => message.id)).toEqual(["u1", "a1"]);
  });

  test("preserves recent messages when context is too long", () => {
    const selected = selectMessagesForContext(
      [
        { role: "user", content: "old ".repeat(40) },
        { role: "assistant", content: "middle ".repeat(40) },
        { role: "user", content: "最新问题" },
      ],
      80,
    );

    expect(selected.truncated).toBe(true);
    expect(selected.messages).toEqual([{ role: "user", content: "最新问题" }]);
  });
});

describe("message thread contracts", () => {
  test("trims valid replies and rejects blank or oversized content", () => {
    expect(parseRequest(CreateThreadReplySchema, {
      parentMessageId: "00000000-0000-4000-8000-000000000000",
      content: "  需要跟进  ",
    })).toEqual({
      ok: true,
      data: {
        parentMessageId: "00000000-0000-4000-8000-000000000000",
        content: "需要跟进",
      },
    });
    expect(parseRequest(CreateThreadReplySchema, {
      parentMessageId: "00000000-0000-4000-8000-000000000000",
      content: "   ",
    }).ok).toBe(false);
    expect(parseRequest(UpdateThreadReplySchema, { content: "x".repeat(4_001) }).ok).toBe(false);
  });
});

describe("media and provider contracts", () => {
  test("rejects unsafe or unsupported request shapes", () => {
    expect(parseRequest(ChatRequestSchema, { content: "你好", extra: true }).ok).toBe(false);
    expect(parseRequest(ImageRequestSchema, { prompt: "图", referenceAssetIds: new Array(5).fill("00000000-0000-4000-8000-000000000000") }).ok).toBe(false);
    expect(parseRequest(VideoRequestSchema, { prompt: "视频", width: 1, height: 1 }).ok).toBe(false);
    expect(parseRequest(VideoRequestSchema, { prompt: "视频", width: 1152, height: 768 }).ok).toBe(true);
  });

  test("validates upload count, type and size", () => {
    expect(validateUpload([{ name: "a.png", type: "image/png", size: 1024 }], { maxCount: 4 })).toEqual({ ok: true });
    expect(validateUpload(new Array(5).fill({ name: "a.png", type: "image/png", size: 1024 }), { maxCount: 4 })).toEqual({
      ok: false,
      error: "最多只能上传 4 张参考图。",
    });
    expect(validateUpload([{ name: "a.pdf", type: "application/pdf", size: 1024 }], { maxCount: 4 })).toEqual({
      ok: false,
      error: "只支持 PNG、JPEG、WebP 或 MP4 文件。",
    });
  });

  test("guards generated remote asset size by headers and streamed bytes", async () => {
    expect(() =>
      guardRemoteAssetResponse(new Response("x", { headers: { "content-length": "101" } }), { maxSize: 100 }),
    ).toThrow("REMOTE_ASSET_TOO_LARGE");

    const guarded = guardRemoteAssetResponse(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(60));
            controller.enqueue(new Uint8Array(60));
            controller.close();
          },
        }),
      ),
      { maxSize: 100 },
    );
    const reader = guarded.body.getReader();

    await expect(reader.read()).resolves.toMatchObject({ done: false });
    await expect(reader.read()).rejects.toThrow("REMOTE_ASSET_TOO_LARGE");
    expect(toClientError(new Error("REMOTE_ASSET_TOO_LARGE"))).toBe("生成结果过大，请调整后重试。");
  });

  test("creates and verifies short-lived asset capability tokens", async () => {
    const token = await createAssetCapabilityToken("assets/image.png", 1_700_000_100, "secret");

    await expect(verifyAssetCapabilityToken("assets/image.png", 1_700_000_001, token, "secret")).resolves.toBe(true);
    await expect(verifyAssetCapabilityToken("assets/other.png", 1_700_000_001, token, "secret")).resolves.toBe(false);
  });

  test("serves media through a whitelist and safe filenames", () => {
    expect(safeMediaType("text/html")).toBe("application/octet-stream");
    expect(safeMediaType("IMAGE/PNG; charset=utf-8")).toBe("image/png");
    expect(safeMediaType(null)).toBe("application/octet-stream");
    expect(safeMediaType("video/mp4")).toBe("video/mp4");
    expect(safeMediaType("image/webp")).toBe("image/webp");
    expect(sanitizeFilename("../坏:file.png")).toBe("坏_file.png");
    expect(sanitizeFilename("")).toBe("asset.bin");
    expect(publicFilename("naihuangbao-1.png")).toBe("asset-1.png");
    expect(publicFilename("奶黄包作品.png")).toBe("asset作品.png");
    expect(contentDisposition("坏:file.png", true)).toContain("filename*=UTF-8''");
    expect(contentDisposition("normal.txt", false)).toBe("inline");
  });

  test("creates object keys based on kind, date, and id with lowercased extension", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(createObjectKey("image", "abc123", "png")).toBe(`image/${today}/abc123.png`);
    expect(createObjectKey("video", "def456", "MP4")).toBe(`video/${today}/def456.mp4`);
    expect(createObjectKey("upload", "ghi789", ".webp")).toBe(`upload/${today}/ghi789.webp`);
  });

  test("builds provider payloads without public-facing provider details", () => {
    const chatPayload = buildChatCompletionPayload([{ role: "user", content: "你是谁？" }]);
    expect(chatPayload.messages[0]).toMatchObject({ role: "system" });
    expect(JSON.stringify(chatPayload.messages[0])).not.toContain("Agnes");
    expect(JSON.stringify(chatPayload.messages[0])).toContain("奶黄包");

    expect(
      buildImageGenerationPayload({
        prompt: "一只猫",
        size: "1024x1024",
        referenceUrls: ["https://media.local/a.png"],
      }),
    ).toEqual({
      model: "agnes-image-2.1-flash",
      prompt: "一只猫",
      size: "1024x1024",
      extra_body: { image: ["https://media.local/a.png"], response_format: "url" },
    });

    expect(buildVideoCreationPayload({ prompt: "云层流动", preset: "max", fps: 60 })).toMatchObject({
      model: "agnes-video-v2.0",
      prompt: "云层流动",
      num_frames: 441,
      frame_rate: 60,
    });
  });

  test("normalizes upstream errors and video task states for the UI", () => {
    expect(normalizeProviderError(401, "Unauthorized: bad api key")).toBe("服务鉴权失败，请检查后台配置。");
    expect(normalizeProviderError(503, "busy")).toBe("服务当前繁忙，请稍后重试。");
    expect(toClientError(new Error("stack trace: token=secret"))).toBe("生成失败，请稍后重试。");
    expect(sanitizeAssistantContent("你好，我是 Agnes-2.0-Flash，由 Sapiens AI 开发。")).toBe("你好，我是奶黄包，由服务团队开发。");
    expect(sanitizeAssistantContent("我是奶黄包。")).toBe("我是奶黄包。");
    expect(normalizeVideoTask({ id: "task_1", status: "completed", progress: 100, video_url: "https://x/y.mp4" })).toEqual({
      id: "task_1",
      status: "completed",
      progress: 100,
      videoUrl: "https://x/y.mp4",
    });
    expect(normalizeVideoTask({ id: "task_2", status: "completed", progress: 100, remixed_from_video_id: "https://x/z.mp4" })).toEqual({
      id: "task_2",
      status: "completed",
      progress: 100,
      videoUrl: "https://x/z.mp4",
    });
  });

  test("does not read an entire upstream error body into memory", async () => {
    let fullTextRead = false;
    const largeErrorBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(8_000)));
        controller.close();
      },
    });
    const upstreamError = new Response(largeErrorBody, { status: 500 });
    Object.defineProperty(upstreamError, "text", {
      value: async () => {
        fullTextRead = true;
        return "x".repeat(8_000);
      },
    });
    const client = new AgnesClient({
      apiKey: "test-key",
      fetcher: async () => upstreamError,
    });

    await expect(client.chat([{ role: "user", content: "你好" }])).rejects.toThrow("服务暂时不可用，请稍后重试。");
    expect(fullTextRead).toBe(false);
  });
});

describe("clear-all scope contracts", () => {
  test("normalizes supported destructive clear scopes only", () => {
    expect(normalizeClearScope("chat")).toBe("chat");
    expect(normalizeClearScope("image")).toBe("image");
    expect(normalizeClearScope("video")).toBe("video");
    expect(normalizeClearScope("assets")).toBe("assets");
    expect(normalizeClearScope("all")).toBe("all");
  });

  test("maps clear scopes to the database asset kinds they remove", () => {
    expect(assetKindsForClearScope("chat")).toEqual([]);
    expect(assetKindsForClearScope("image")).toEqual(["image"]);
    expect(assetKindsForClearScope("video")).toEqual(["video"]);
    expect(assetKindsForClearScope("assets")).toEqual(["upload", "image", "video"]);
    expect(assetKindsForClearScope("all")).toEqual(["upload", "image", "video"]);
  });

  test("removes chat side tables before messages and conversations", () => {
    expect(chatTablesForClearScope("image")).toEqual([]);
    expect(chatTablesForClearScope("chat")).toEqual([
      "message_edits",
      "reactions",
      "pins",
      "bookmarks",
      "message_threads",
      "messages",
      "conversations",
    ]);
    expect(chatTablesForClearScope("all")).toEqual(chatTablesForClearScope("chat"));
  });
});
