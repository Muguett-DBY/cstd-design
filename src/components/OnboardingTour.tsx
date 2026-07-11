import { useEffect, useId, useRef, useState } from "react";
import { Command, Globe, Keyboard, Palette, Share2, Sparkles, X } from "lucide-react";
import { ONBOARDING_STORAGE_KEY } from "../storage-keys";

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
    icon: <Command size={32} />,
    title: "命令面板",
    description: "按 Cmd/Ctrl+K 打开命令面板，快速搜索操作、对话、主题。",
  },
  {
    icon: <Palette size={32} />,
    title: "多种主题",
    description: "在设置中选择 6 种主题（暖色、复古、海洋、森林、夜深），支持中英文界面。",
  },
  {
    icon: <Keyboard size={32} />,
    title: "快捷键",
    description: "按 Cmd/Ctrl+/ 查看所有快捷键，包括搜索、保存、收藏等。",
  },
  {
    icon: <Share2 size={32} />,
    title: "分享对话",
    description: "通过命令面板的「分享对话」创建只读链接，与他人分享你的创作。",
  },
  {
    icon: <Globe size={32} />,
    title: "数据备份",
    description: "在设置中导出全部设置为 JSON 文件，便于在新设备上恢复。",
  },
  {
    icon: <Sparkles size={32} />,
    title: "准备好了",
    description: "开始你的第一次创作吧！随时可按 Cmd+K 调出命令面板。",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      nextButtonRef.current?.focus();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  function complete() {
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, "true"); } catch { /* ignore storage errors */ }
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
    <dialog
      ref={dialogRef}
      className="onboarding-overlay"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        complete();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          prev();
        }
      }}
    >
      <div className="onboarding-backdrop" aria-hidden="true" />
      <div className="onboarding-card">
        <button type="button" className="onboarding-close" onClick={complete} aria-label="关闭引导">
          <X size={18} />
        </button>
        <div className="onboarding-icon">{current.icon}</div>
        <h2 id={titleId} className="onboarding-title">{current.title}</h2>
        <p id={descriptionId} className="onboarding-description">{current.description}</p>
        <p className="onboarding-progress" aria-live="polite">第 {step + 1}/{TOUR_STEPS.length} 步</p>
        <div className="onboarding-dots" aria-hidden="true">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? " active" : ""}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {!isFirst && (
            <button type="button" className="ghost-button" onClick={prev}>上一步</button>
          )}
          <button ref={nextButtonRef} type="button" className="primary-button" onClick={next}>
            {isLast ? "开始使用" : "下一步"}
          </button>
          <button type="button" className="onboarding-skip" onClick={complete}>跳过引导</button>
        </div>
      </div>
    </dialog>
  );
}
