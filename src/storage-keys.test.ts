import { describe, expect, test } from "vitest";
import { BACKUP_KEYS, EXPORT_PREFERENCES_STORAGE_KEY } from "./storage-keys";

describe("storage key backup coverage", () => {
  test("includes export preferences in settings backups", () => {
    expect(BACKUP_KEYS).toContain(EXPORT_PREFERENCES_STORAGE_KEY);
  });
});
