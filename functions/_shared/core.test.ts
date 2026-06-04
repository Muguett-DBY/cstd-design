import { describe, expect, test } from "vitest";
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
import { ChatRequestSchema, ImageRequestSchema, parseRequest, VideoRequestSchema } from "./validation";
import { assetKindsForClearScope, normalizeClearScope } from "./clear";

describe("security", () => {
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
});

describe("chat tree and context", () => {
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

  test("creates and verifies short-lived asset capability tokens", async () => {
    const token = await createAssetCapabilityToken("assets/image.png", 1_700_000_100, "secret");

    await expect(verifyAssetCapabilityToken("assets/image.png", 1_700_000_001, token, "secret")).resolves.toBe(true);
    await expect(verifyAssetCapabilityToken("assets/other.png", 1_700_000_001, token, "secret")).resolves.toBe(false);
  });

  test("serves media through a whitelist and safe filenames", () => {
    expect(safeMediaType("text/html")).toBe("application/octet-stream");
    expect(safeMediaType("IMAGE/PNG; charset=utf-8")).toBe("image/png");
    expect(sanitizeFilename("../坏:file.png")).toBe("坏_file.png");
    expect(publicFilename("naihuangbao-1.png")).toBe("asset-1.png");
    expect(contentDisposition("坏:file.png", true)).toContain("filename*=UTF-8''");
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
});
