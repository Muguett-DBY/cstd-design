import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:onboarding-tips";

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "欢迎使用 cstd-design",
    content: "这是一个 AI 创意工作空间，支持对话、图片生成和视频生成。",
    position: "bottom",
  },
  {
    id: "chat",
    title: "开始对话",
    content: "在聊天界面输入问题，AI 助手会为你解答。",
    position: "bottom",
  },
  {
    id: "image",
    title: "生成图片",
    content: "在图片工作区输入描述，AI 会生成对应的图片。",
    position: "bottom",
  },
  {
    id: "assets",
    title: "管理素材",
    content: "所有生成的图片和视频都会保存在素材库中。",
    position: "bottom",
  },
  {
    id: "search",
    title: "搜索功能",
    content: "使用 Cmd+Shift+F 全局搜索对话和素材。",
    position: "bottom",
  },
];

function getNextStep(completedSteps: Set<string>): OnboardingStep | null {
  if (completedSteps.size >= ONBOARDING_STEPS.length) return null;
  return ONBOARDING_STEPS.find((s) => !completedSteps.has(s.id)) || null;
}

export function useOnboarding() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const skipAll = useCallback(() => {
    const allIds = new Set(ONBOARDING_STEPS.map((s) => s.id));
    setCompletedSteps(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedSteps(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const currentStep = getNextStep(completedSteps);
  const isComplete = completedSteps.size >= ONBOARDING_STEPS.length;
  const progress = completedSteps.size / ONBOARDING_STEPS.length;

  return {
    currentStep,
    isComplete,
    progress,
    completeStep,
    skipAll,
    resetOnboarding,
    steps: ONBOARDING_STEPS,
  };
}
