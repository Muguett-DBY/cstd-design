import { describe, expect, test } from "vitest";
import { buildServiceReadiness } from "./readiness";

describe("buildServiceReadiness", () => {
  test("reports a ready snapshot without claiming upstream reachability", () => {
    const snapshot = buildServiceReadiness({
      databaseReachable: true,
      mediaStorageReachable: true,
      generationConfigured: true,
      securityConfigured: true,
      checkedAt: "2026-06-28T00:00:00.000Z",
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.checkedAt).toBe("2026-06-28T00:00:00.000Z");
    expect(snapshot.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "generation", status: "ready", detail: expect.stringContaining("首次请求") }),
    ]));
  });

  test("reports attention when a required dependency is unavailable", () => {
    const snapshot = buildServiceReadiness({
      databaseReachable: true,
      mediaStorageReachable: false,
      generationConfigured: false,
      securityConfigured: true,
      checkedAt: "2026-06-28T00:00:00.000Z",
    });

    expect(snapshot.status).toBe("attention");
    expect(snapshot.checks.filter((check) => check.status === "attention").map((check) => check.id)).toEqual([
      "media",
      "generation",
    ]);
  });
});
