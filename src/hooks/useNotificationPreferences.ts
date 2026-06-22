import { useCallback, useState } from "react";

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
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
