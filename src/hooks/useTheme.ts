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

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
