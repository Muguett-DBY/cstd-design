import { describe, expect, test } from "vitest";
import { isPlainRecord, isStringArray, parseStoredJson } from "./storageJson";

describe("storageJson", () => {
  test("returns fallback for missing or malformed JSON", () => {
    expect(parseStoredJson(null, ["fallback"], isStringArray)).toEqual(["fallback"]);
    expect(parseStoredJson("not-json", ["fallback"], isStringArray)).toEqual(["fallback"]);
  });

  test("returns fallback when parsed JSON fails its guard", () => {
    expect(parseStoredJson(JSON.stringify({ a: "b" }), [], isStringArray)).toEqual([]);
  });

  test("returns parsed JSON when it passes its guard", () => {
    expect(parseStoredJson(JSON.stringify(["a", "b"]), [], isStringArray)).toEqual(["a", "b"]);
  });

  test("recognizes plain records without accepting arrays or null", () => {
    expect(isPlainRecord({ ok: true })).toBe(true);
    expect(isPlainRecord([])).toBe(false);
    expect(isPlainRecord(null)).toBe(false);
  });
});
