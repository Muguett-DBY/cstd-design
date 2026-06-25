import { describe, expect, test } from "vitest";
import { generateSmartFilename, generateExportFilename } from "./smartFilename";

describe("generateSmartFilename", () => {
  test("generates filename with title and timestamp", () => {
    const result = generateSmartFilename({
      title: "My Conversation",
      format: "md",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/^My_Conversation_\d{4}-\d{2}-\d{2}_\d{4}\.md$/);
  });

  test("sanitizes special characters", () => {
    const result = generateSmartFilename({
      title: "File:Name?With<Special>Chars",
      format: "md",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).not.toMatch(/[<>:"/\\|?*]/);
  });

  test("adds prefix when provided", () => {
    const result = generateSmartFilename({
      title: "Test",
      format: "md",
      prefix: "export",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/^export_Test_/);
  });

  test("adds suffix when provided", () => {
    const result = generateSmartFilename({
      title: "Test",
      format: "md",
      suffix: "selection",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/_selection\.md$/);
  });

  test("uses correct extension for pdf", () => {
    const result = generateSmartFilename({
      title: "Test",
      format: "pdf",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/\.pdf$/);
  });

  test("uses correct extension for html", () => {
    const result = generateSmartFilename({
      title: "Test",
      format: "html",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/\.html$/);
  });

  test("uses correct extension for text", () => {
    const result = generateSmartFilename({
      title: "Test",
      format: "text",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).toMatch(/\.txt$/);
  });

  test("truncates long filenames", () => {
    const result = generateSmartFilename({
      title: "A".repeat(200),
      format: "md",
      maxLength: 50,
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result.length).toBeLessThanOrEqual(50);
  });

  test("collapses multiple underscores", () => {
    const result = generateSmartFilename({
      title: "Test   Multiple   Spaces",
      format: "md",
      date: new Date("2026-06-25T12:30:00Z"),
    });
    expect(result).not.toMatch(/___/);
  });
});

describe("generateExportFilename", () => {
  test("generates full export filename", () => {
    const result = generateExportFilename("My Chat", "md", "full");
    expect(result).toMatch(/^My_Chat_/);
    expect(result).toMatch(/\.md$/);
  });

  test("adds selection suffix", () => {
    const result = generateExportFilename("My Chat", "md", "selection");
    expect(result).toMatch(/_selection\.md$/);
  });

  test("adds filtered suffix", () => {
    const result = generateExportFilename("My Chat", "md", "filtered");
    expect(result).toMatch(/_filtered\.md$/);
  });
});
