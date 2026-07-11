import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TranslationKey } from "../hooks/useLanguage";
import { SettingsModal } from "./SettingsModal";

const TEST_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
  "settings.title": "偏好设置",
  "common.close": "关闭",
  "settings.theme": "主题外观",
  "settings.language": "界面语言",
  "language.zh": "中文",
  "language.en": "English",
  "settings.image": "图片生成",
  "settings.video": "视频生成",
  "settings.chat": "聊天",
  "settings.saved": "设置会自动保存",
};

function createProps(): ComponentProps<typeof SettingsModal> {
  return {
    open: true,
    onClose: vi.fn(),
    prefs: {
      defaultImageSize: "1024x1024",
      defaultVideoPreset: "standard",
      defaultVideoFps: 24,
      defaultVideoAspect: "1152x768",
      defaultStyle: "none",
      autoSaveDraft: true,
      showMessageTimestamps: true,
      enableSoundEffects: false,
      customTabLabels: { chat: "", image: "", video: "", assets: "" },
    },
    onUpdate: vi.fn(),
    theme: "light",
    onThemeChange: vi.fn(),
    language: "zh",
    onLanguageChange: vi.fn(),
    t: (key) => TEST_TRANSLATIONS[key] ?? key,
    onNotice: vi.fn(),
    notifications: {
      permission: "denied",
      enabled: false,
      request: vi.fn(async () => "denied" as const),
      setEnabled: vi.fn(),
    },
    autoTheme: false,
    onAutoThemeChange: vi.fn(),
    customTabLabels: { chat: "", image: "", video: "", assets: "" },
    onCustomTabLabelsChange: vi.fn(),
  };
}

describe("SettingsModal", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
      },
      configurable: true,
    });

    if (!HTMLDialogElement.prototype.showModal) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, writable: true, value: vi.fn() });
    }
    vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function showModal(this: HTMLDialogElement) {
      Object.defineProperty(this, "open", { configurable: true, value: true });
      this.setAttribute("open", "");
    });
    document.body.style.overflow = "auto";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  test("opens as a labelled native modal and locks background scrolling", () => {
    render(<SettingsModal {...createProps()} />);

    const dialog = screen.getByRole("dialog");
    const titleId = dialog.getAttribute("aria-labelledby");

    expect(dialog.tagName).toBe("DIALOG");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    expect(titleId).toBeTruthy();
    expect(titleId ? document.getElementById(titleId)?.textContent : "").toContain("偏好设置");
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("handles the native cancel event through the controlled close callback", () => {
    const props = createProps();
    render(<SettingsModal {...props} />);

    const cancelEvent = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  test("moves focus into the modal and restores the opener when unmounted", () => {
    const opener = document.createElement("button");
    opener.textContent = "打开设置";
    document.body.append(opener);
    opener.focus();

    const { unmount } = render(<SettingsModal {...createProps()} />);

    expect(document.activeElement).toBe(screen.getAllByRole("button", { name: "关闭" })[0]);

    unmount();

    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("auto");
    opener.remove();
  });

  test("keeps focus inside the modal when StrictMode replays effects", () => {
    const opener = document.createElement("button");
    opener.textContent = "打开设置";
    document.body.append(opener);
    opener.focus();

    render(
      <StrictMode>
        <SettingsModal {...createProps()} />
      </StrictMode>,
    );

    expect(document.activeElement).toBe(screen.getAllByRole("button", { name: "关闭" })[0]);
    opener.remove();
  });
});
