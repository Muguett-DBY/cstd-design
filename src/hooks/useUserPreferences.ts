import { useEffect, useState } from "react";

export interface UserPreferences {
  defaultImageSize: "1024x1024" | "1024x768" | "768x1024";
  defaultVideoPreset: "short" | "standard" | "max";
  defaultVideoFps: 24 | 30;
  defaultVideoAspect: "1152x768" | "1280x720" | "720x1280" | "1920x1080";
  defaultStyle: string;
  autoSaveDraft: boolean;
  showMessageTimestamps: boolean;
  enableSoundEffects: boolean;
  customTabLabels: {
    chat: string;
    image: string;
    video: string;
    assets: string;
  };
}

const STORAGE_KEY = "cstd-design:preferences";

const DEFAULT_PREFS: UserPreferences = {
  defaultImageSize: "1024x1024",
  defaultVideoPreset: "standard",
  defaultVideoFps: 24,
  defaultVideoAspect: "1152x768",
  defaultStyle: "none",
  autoSaveDraft: true,
  showMessageTimestamps: true,
  enableSoundEffects: false,
  customTabLabels: {
    chat: "",
    image: "",
    video: "",
    assets: "",
  },
};

function loadPrefs(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

function persist(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPrefs);

  useEffect(() => {
    persist(prefs);
  }, [prefs]);

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return { prefs, update };
}
