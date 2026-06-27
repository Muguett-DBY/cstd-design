import { describe, expect, test } from "vitest";
import {
  ASSET_SORT_STORAGE_KEY,
  BACKUP_KEY_LABELS,
  BACKUP_KEYS,
  CREATION_ACTIVITY_STORAGE_KEY,
  CREATION_RECOVERY_STORAGE_KEY,
  EXPORT_PREFERENCES_STORAGE_KEY,
} from "./storage-keys";

describe("storage key backup coverage", () => {
  test("includes export preferences in settings backups", () => {
    expect(BACKUP_KEYS).toContain(EXPORT_PREFERENCES_STORAGE_KEY);
  });

  test("shows a reader-facing label for export preferences in backup previews", () => {
    expect(BACKUP_KEY_LABELS[EXPORT_PREFERENCES_STORAGE_KEY]).toBe("导出偏好");
  });

  test("includes recovery center data in settings backups", () => {
    expect(BACKUP_KEYS).toContain(CREATION_RECOVERY_STORAGE_KEY);
    expect(BACKUP_KEYS).toContain(CREATION_ACTIVITY_STORAGE_KEY);
  });

  test("shows reader-facing labels for recovery center backup data", () => {
    expect(BACKUP_KEY_LABELS[CREATION_RECOVERY_STORAGE_KEY]).toBe("恢复备份");
    expect(BACKUP_KEY_LABELS[CREATION_ACTIVITY_STORAGE_KEY]).toBe("恢复记录");
  });

  test("includes asset sort preferences in settings backups", () => {
    expect(BACKUP_KEYS).toContain(ASSET_SORT_STORAGE_KEY);
    expect(BACKUP_KEY_LABELS[ASSET_SORT_STORAGE_KEY]).toBe("素材排序偏好");
  });
});
