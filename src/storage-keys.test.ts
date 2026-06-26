import { describe, expect, test } from "vitest";
import { BACKUP_KEY_LABELS, BACKUP_KEYS, EXPORT_PREFERENCES_STORAGE_KEY } from "./storage-keys";

describe("storage key backup coverage", () => {
  test("includes export preferences in settings backups", () => {
    expect(BACKUP_KEYS).toContain(EXPORT_PREFERENCES_STORAGE_KEY);
  });

  test("shows a reader-facing label for export preferences in backup previews", () => {
    expect(BACKUP_KEY_LABELS[EXPORT_PREFERENCES_STORAGE_KEY]).toBe("导出偏好");
  });
});
