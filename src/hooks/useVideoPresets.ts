import { useCallback, useEffect, useState } from "react";
import type { VideoPreset } from "../types";

const STORAGE_KEY = "cstd-design:video-presets";

export interface VideoPresetTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  preset: VideoPreset;
  fps: number;
  aspectRatio: string;
  icon?: string;
}

const SEED: VideoPresetTemplate[] = [
  {
    id: "seed-1",
    name: "产品展示",
    description: "专业产品镜头，缓慢推近，柔和光线",
    prompt: "一段专业产品展示视频。镜头缓慢推近产品，柔和的环形光线，白色背景，画面干净专业。",
    preset: "standard",
    fps: 24,
    aspectRatio: "1280x720",
  },
  {
    id: "seed-2",
    name: "自然风光",
    description: "延时摄影风格，广阔自然景观",
    prompt: "壮丽的自然风光延时摄影，广阔的山脉和云海流动，光线随时间变化，电影感色调。",
    preset: "max",
    fps: 30,
    aspectRatio: "1920x1080",
  },
  {
    id: "seed-3",
    name: "城市街景",
    description: "都市夜景，霓虹灯，行人",
    prompt: "繁华城市街道夜景，霓虹灯闪烁，行人匆匆，雨后湿漉漉的街道反射灯光，电影感画面。",
    preset: "standard",
    fps: 24,
    aspectRatio: "1280x720",
  },
  {
    id: "seed-4",
    name: "角色动画",
    description: "二次元角色，流畅动作",
    prompt: "动漫风格的二次元角色，柔和色彩，流畅的动作和表情，画面充满活力。",
    preset: "standard",
    fps: 24,
    aspectRatio: "720x1280",
  },
  {
    id: "seed-5",
    name: "抽象动态",
    description: "流体和粒子，循环动效",
    prompt: "抽象艺术风格，流动的彩色液体和粒子效果，循环动效，适合做背景。",
    preset: "short",
    fps: 30,
    aspectRatio: "1280x720",
  },
];

function loadPresets(): VideoPresetTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return SEED;
}

function persist(presets: VideoPresetTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage may be full
  }
}

export function useVideoPresets() {
  const [presets, setPresets] = useState<VideoPresetTemplate[]>(loadPresets);

  useEffect(() => {
    persist(presets);
  }, [presets]);

  const add = useCallback((preset: Omit<VideoPresetTemplate, "id">) => {
    const newPreset: VideoPresetTemplate = {
      ...preset,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    };
    setPresets((prev) => [newPreset, ...prev]);
    return newPreset;
  }, []);

  const remove = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, add, remove };
}
