import { describe, it, expect } from "vitest";
import { analyzeAssetQuality } from "./useAssetQuality";

describe("analyzeAssetQuality", () => {
  it("returns high quality for good image", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(result.level).toBe("high");
    expect(result.score).toBe(100);
  });

  it("returns medium quality for small resolution", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/png",
      width: 100,
      height: 100,
    });
    expect(result.level).toBe("medium");
    expect(result.score).toBe(70);
  });

  it("returns high quality for large file (score 85 >= 80)", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 6 * 1024 * 1024,
      mediaType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(result.level).toBe("high");
    expect(result.score).toBe(85);
  });

  it("adds suggestion for low resolution", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/png",
      width: 100,
      height: 100,
    });
    expect(result.suggestions.some((s) => s.includes("分辨率"))).toBe(true);
  });

  it("adds suggestion for large file", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 6 * 1024 * 1024,
      mediaType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(result.suggestions.some((s) => s.includes("压缩"))).toBe(true);
  });

  it("adds format suggestion for JPEG", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/jpeg",
      width: 1920,
      height: 1080,
    });
    expect(result.suggestions.some((s) => s.includes("JPEG"))).toBe(true);
  });

  it("adds format suggestion for PNG", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(result.suggestions.some((s) => s.includes("PNG"))).toBe(true);
  });

  it("adds format suggestion for WebP", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 1024 * 1024,
      mediaType: "image/webp",
      width: 1920,
      height: 1080,
    });
    expect(result.suggestions.some((s) => s.includes("WebP"))).toBe(true);
  });

  it("handles video assets", () => {
    const result = analyzeAssetQuality({
      kind: "video",
      size: 50 * 1024 * 1024,
      mediaType: "video/mp4",
    });
    expect(result.level).toBe("high");
    expect(result.suggestions.some((s) => s.includes("MP4"))).toBe(true);
  });

  it("returns high quality for large video (score 80 >= 80)", () => {
    const result = analyzeAssetQuality({
      kind: "video",
      size: 200 * 1024 * 1024,
      mediaType: "video/mp4",
    });
    expect(result.level).toBe("high");
    expect(result.score).toBe(80);
  });

  it("handles high resolution image", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 10 * 1024 * 1024,
      mediaType: "image/png",
      width: 4000,
      height: 3000,
    });
    expect(result.suggestions.some((s) => s.includes("高分辨率"))).toBe(true);
  });

  it("handles small file size", () => {
    const result = analyzeAssetQuality({
      kind: "image",
      size: 30 * 1024,
      mediaType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(result.suggestions.some((s) => s.includes("文件较小"))).toBe(true);
  });
});
