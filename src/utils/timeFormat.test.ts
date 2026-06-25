import { describe, expect, test, vi, afterEach } from "vitest";
import { formatRelativeTime, formatMessageTime, getDateSeparator } from "./timeFormat";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns '刚刚' for less than 60 seconds ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:30Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("刚刚");
  });

  test("returns minutes ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:05:00Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("5 分钟前");
  });

  test("returns hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T15:00:00Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("3 小时前");
  });

  test("returns days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("3 天前");
  });

  test("returns month/day for same year (>= 7 days)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("6月25日");
  });

  test("returns year/month/day for different year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
    expect(formatRelativeTime("2026-06-25T12:00:00Z")).toBe("2026年6月25日");
  });
});

describe("formatMessageTime", () => {
  test("formats UTC time to local display", () => {
    const result = formatMessageTime("2026-06-25T00:00:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  test("always returns HH:MM format", () => {
    const result = formatMessageTime("2026-06-25T12:30:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("getDateSeparator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns '今天' for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
    expect(getDateSeparator("2026-06-25T08:00:00Z")).toBe("今天");
  });

  test("returns '昨天' for yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
    expect(getDateSeparator("2026-06-24T08:00:00Z")).toBe("昨天");
  });

  test("returns weekday for recent days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
    expect(getDateSeparator("2026-06-22T08:00:00Z")).toBe("周一");
  });

  test("returns month/day for older dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00Z"));
    expect(getDateSeparator("2026-06-15T08:00:00Z")).toBe("6月15日");
  });
});
