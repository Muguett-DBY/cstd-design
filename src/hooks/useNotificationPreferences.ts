import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:notification-preferences";

type NotificationType = "message" | "image" | "video" | "system";

interface NotificationPreferences {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  types: {
    message: true,
    image: true,
    video: true,
    system: true,
  },
};

function loadPreferences(): NotificationPreferences {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const savedTypes = isPlainRecord(parsed.types) ? parsed.types : {};
  return {
    enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_PREFS.enabled,
    types: {
      message: typeof savedTypes.message === "boolean" ? savedTypes.message : DEFAULT_PREFS.types.message,
      image: typeof savedTypes.image === "boolean" ? savedTypes.image : DEFAULT_PREFS.types.image,
      video: typeof savedTypes.video === "boolean" ? savedTypes.video : DEFAULT_PREFS.types.video,
      system: typeof savedTypes.system === "boolean" ? savedTypes.system : DEFAULT_PREFS.types.system,
    },
  };
}

function savePreferences(prefs: NotificationPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(loadPreferences);

  const setEnabled = useCallback((enabled: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev, enabled };
      savePreferences(next);
      return next;
    });
  }, []);

  const setTypeEnabled = useCallback((type: NotificationType, enabled: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev, types: { ...prev.types, [type]: enabled } };
      savePreferences(next);
      return next;
    });
  }, []);

  const shouldNotify = useCallback((type: NotificationType): boolean => {
    return preferences.enabled && preferences.types[type];
  }, [preferences]);

  return { preferences, setEnabled, setTypeEnabled, shouldNotify };
}
