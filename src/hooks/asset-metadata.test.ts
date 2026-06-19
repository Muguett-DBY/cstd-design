import { describe, it, expect } from "vitest";
import { formatDimensions, formatDuration, getAssetMetadata } from "../hooks/asset-metadata";

describe("asset-metadata utilities", () => {
  describe("formatDimensions", () => {
    it("returns empty string when width is missing", () => {
      expect(formatDimensions(undefined, 100)).toBe("");
    });

    it("returns empty string when height is missing", () => {
      expect(formatDimensions(100, undefined)).toBe("");
    });

    it("returns dimensions in WIDTHxHEIGHT format", () => {
      expect(formatDimensions(1920, 1080)).toBe("1920×1080");
    });
  });

  describe("formatDuration", () => {
    it("returns empty string when duration is undefined", () => {
      expect(formatDuration(undefined)).toBe("");
    });

    it("returns empty string when duration is zero", () => {
      expect(formatDuration(0)).toBe("");
    });

    it("returns empty string when duration is infinite", () => {
      expect(formatDuration(Infinity)).toBe("");
    });

    it("returns MM:SS for durations under an hour", () => {
      expect(formatDuration(65)).toBe("1:05");
    });

    it("pads seconds with zero", () => {
      expect(formatDuration(5)).toBe("0:05");
    });
  });

  describe("getAssetMetadata", () => {
    it("returns empty string when no metadata available", () => {
      expect(getAssetMetadata({ mediaType: "video/mp4" })).toBe("");
    });

    it("returns dimensions for images", () => {
      expect(getAssetMetadata({ mediaType: "image/png", width: 800, height: 600 })).toBe("800×600");
    });

    it("returns duration for videos without dimensions", () => {
      expect(getAssetMetadata({ mediaType: "video/mp4", duration: 120 })).toBe("2:00");
    });

    it("prefers dimensions over duration when both present", () => {
      expect(getAssetMetadata({ mediaType: "video/mp4", width: 1920, height: 1080, duration: 120 })).toBe("1920×1080");
    });
  });
});
