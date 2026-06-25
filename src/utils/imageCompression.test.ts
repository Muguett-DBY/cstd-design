import { describe, expect, test } from "vitest";
import { shouldCompress, formatCompressionRatio } from "./imageCompression";

describe("shouldCompress", () => {
  test("returns false for non-image files", () => {
    const file = new File(["content"], "doc.txt", { type: "text/plain" });
    expect(shouldCompress(file)).toBe(false);
  });

  test("returns false for small images", () => {
    const smallContent = new Uint8Array(500 * 1024);
    const file = new File([smallContent], "small.png", { type: "image/png" });
    expect(shouldCompress(file)).toBe(false);
  });

  test("returns true for large images", () => {
    const largeContent = new Uint8Array(2 * 1024 * 1024);
    const file = new File([largeContent], "large.png", { type: "image/png" });
    expect(shouldCompress(file)).toBe(true);
  });
});

describe("formatCompressionRatio", () => {
  test("calculates compression ratio correctly", () => {
    expect(formatCompressionRatio(1000, 500)).toBe("50%");
  });

  test("handles no compression", () => {
    expect(formatCompressionRatio(1000, 1000)).toBe("0%");
  });

  test("handles small compression", () => {
    expect(formatCompressionRatio(1000, 900)).toBe("10%");
  });

  test("handles significant compression", () => {
    expect(formatCompressionRatio(1000, 100)).toBe("90%");
  });
});
