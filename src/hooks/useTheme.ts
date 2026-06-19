import { useCallback, useEffect, useState } from "react";

export const THEMES = [
  { id: "light", label: "暖色（浅）", description: "默认暖色调，浅色背景" },
  { id: "dark", label: "暖色（深）", description: "默认暖色调，深色背景" },
  { id: "sepia", label: "复古护眼", description: "米黄色调，长时间阅读舒适" },
  { id: "ocean", label: "海洋蓝", description: "清爽蓝色调" },
  { id: "forest", label: "森林绿", description: "自然绿色调" },
  { id: "night", label: "深夜模式", description: "GitHub 风格深色" },
] as const;

export type ThemeId = typeof THEMES[number]["id"];

const STORAGE_KEY = "cstd-design:theme";

function getInitialTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && document.documentElement.classList.contains("theme-dark")) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
  if (theme !== "light") root.classList.add(`theme-${theme}`);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);
  const [autoMode, setAutoModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}-auto`) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!autoMode) {
      applyTheme(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    }
  }, [theme, autoMode]);

  useEffect(() => {
    if (!autoMode) return;
    const checkTime = () => {
      const hour = new Date().getHours();
      const newTheme: ThemeId = (hour >= 6 && hour < 18) ? "light" : "dark";
      if (newTheme !== theme) {
        applyTheme(newTheme);
      }
    };
    checkTime();
    const interval = window.setInterval(checkTime, 60 * 1000);
    try {
      localStorage.setItem(`${STORAGE_KEY}-auto`, "true");
    } catch {
      // ignore
    }
    return () => window.clearInterval(interval);
  }, [autoMode, theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  const setAutoMode = useCallback((enabled: boolean) => {
    setAutoModeState(enabled);
    try {
      localStorage.setItem(`${STORAGE_KEY}-auto`, String(enabled));
    } catch {
      // ignore
    }
  }, []);

  return { theme, setTheme, autoMode, setAutoMode };
}
