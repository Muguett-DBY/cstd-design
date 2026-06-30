import { useEffect, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

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

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function loadPrefs(): UserPreferences {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const tabLabels = isPlainRecord(parsed.customTabLabels) ? parsed.customTabLabels : {};
  return {
    defaultImageSize: parsed.defaultImageSize === "1024x1024" || parsed.defaultImageSize === "1024x768" || parsed.defaultImageSize === "768x1024"
      ? parsed.defaultImageSize
      : DEFAULT_PREFS.defaultImageSize,
    defaultVideoPreset: parsed.defaultVideoPreset === "short" || parsed.defaultVideoPreset === "standard" || parsed.defaultVideoPreset === "max"
      ? parsed.defaultVideoPreset
      : DEFAULT_PREFS.defaultVideoPreset,
    defaultVideoFps: parsed.defaultVideoFps === 24 || parsed.defaultVideoFps === 30 ? parsed.defaultVideoFps : DEFAULT_PREFS.defaultVideoFps,
    defaultVideoAspect: parsed.defaultVideoAspect === "1152x768" || parsed.defaultVideoAspect === "1280x720" || parsed.defaultVideoAspect === "720x1280" || parsed.defaultVideoAspect === "1920x1080"
      ? parsed.defaultVideoAspect
      : DEFAULT_PREFS.defaultVideoAspect,
    defaultStyle: readString(parsed.defaultStyle, DEFAULT_PREFS.defaultStyle),
    autoSaveDraft: typeof parsed.autoSaveDraft === "boolean" ? parsed.autoSaveDraft : DEFAULT_PREFS.autoSaveDraft,
    showMessageTimestamps: typeof parsed.showMessageTimestamps === "boolean" ? parsed.showMessageTimestamps : DEFAULT_PREFS.showMessageTimestamps,
    enableSoundEffects: typeof parsed.enableSoundEffects === "boolean" ? parsed.enableSoundEffects : DEFAULT_PREFS.enableSoundEffects,
    customTabLabels: {
      chat: readString(tabLabels.chat, DEFAULT_PREFS.customTabLabels.chat),
      image: readString(tabLabels.image, DEFAULT_PREFS.customTabLabels.image),
      video: readString(tabLabels.video, DEFAULT_PREFS.customTabLabels.video),
      assets: readString(tabLabels.assets, DEFAULT_PREFS.customTabLabels.assets),
    },
  };
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
