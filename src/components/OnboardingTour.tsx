import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "cstd-design:onboardingComplete";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: <Sparkles size={32} />,
    title: "欢迎使用",
    description: "这是一个私人 AI 创作工作台，支持对话、图片生成和视频生成。",
  },
  {
    icon: <Sparkles size={32} />,
    title: "开始对话",
    description: "在左侧选择\"新会话\"或按 Ctrl+N 创建新对话，与 AI 进行交流。",
  },
  {
    icon: <Sparkles size={32} />,
    title: "生成图片",
    description: "切换到\"图片\"标签，输入描述并选择风格，可生成 AI 图片。",
  },
  {
    icon: <Sparkles size={32} />,
    title: "生成视频",
    description: "切换到\"视频\"标签，输入描述可生成 AI 视频。",
  },
  {
    icon: <Sparkles size={32} />,
    title: "管理素材",
    description: "所有生成的图片和视频都会保存到\"素材库\"，可随时查看和下载。",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") complete();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  function complete() {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore storage errors */ }
    setVisible(false);
  }

  function next() {
    if (isLast) complete();
    else setStep((s) => s + 1);
  }

  function prev() {
    if (!isFirst) setStep((s) => s - 1);
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="新用户引导">
      <div className="onboarding-backdrop" />
      <div className="onboarding-card">
        <button type="button" className="onboarding-close" onClick={complete} aria-label="关闭引导">
          <X size={18} />
        </button>
        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-description">{current.description}</p>
        <div className="onboarding-dots">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? " active" : ""}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {!isFirst && (
            <button type="button" className="ghost-button" onClick={prev}>上一步</button>
          )}
          <button type="button" className="primary-button" onClick={next} autoFocus>
            {isLast ? "开始使用" : "下一步"}
          </button>
          <button type="button" className="onboarding-skip" onClick={complete}>跳过引导</button>
        </div>
      </div>
    </div>
  );
}
