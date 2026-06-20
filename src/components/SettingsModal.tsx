import { Settings as SettingsIcon, X, Download, Upload, Keyboard } from "lucide-react";
import { useRef } from "react";
import type { UserPreferences } from "../hooks/useUserPreferences";
import { THEMES, type ThemeId } from "../hooks/useTheme";
import type { Language, TranslationKey } from "../hooks/useLanguage";
import { BackupRestore } from "./BackupRestore";
import { useCustomShortcuts, type ShortcutAction } from "../hooks/useCustomShortcuts";

function exportSettingsProfile(args: {
  theme: ThemeId;
  language: Language;
  prefs: UserPreferences;
  customTabLabels: { chat: string; image: string; video: string; assets: string };
  autoTheme: boolean;
}) {
  const profile = {
    type: "cstd-design.settings",
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: args.theme,
    language: args.language,
    autoTheme: args.autoTheme,
    preferences: args.prefs,
    customTabLabels: args.customTabLabels,
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cstd-design-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function importSettingsProfile(
  file: File,
  callbacks: {
    onTheme: (theme: ThemeId) => void;
    onLanguage: (language: Language) => void;
    onPrefs: (prefs: UserPreferences) => void;
    onCustomTabLabels?: (labels: { chat: string; image: string; video: string; assets: string }) => void;
    onAutoTheme: (enabled: boolean) => void;
  }
): Promise<{ ok: true; theme: ThemeId; language: Language } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.type !== "cstd-design.settings") {
          resolve({ ok: false, error: "无效的配置文件" });
          return;
        }
        if (parsed.theme && typeof parsed.theme === "string" && parsed.theme in THEMES) {
          callbacks.onTheme(parsed.theme as ThemeId);
        }
        if (parsed.language && (parsed.language === "zh" || parsed.language === "en")) {
          callbacks.onLanguage(parsed.language);
        }
        if (parsed.preferences && typeof parsed.preferences === "object") {
          callbacks.onPrefs(parsed.preferences as UserPreferences);
        }
        if (parsed.customTabLabels && typeof parsed.customTabLabels === "object" && callbacks.onCustomTabLabels) {
          callbacks.onCustomTabLabels(parsed.customTabLabels);
        }
        if (typeof parsed.autoTheme === "boolean") {
          callbacks.onAutoTheme(parsed.autoTheme);
        }
        resolve({ ok: true, theme: parsed.theme, language: parsed.language });
      } catch (err) {
        resolve({ ok: false, error: err instanceof Error ? err.message : "解析失败" });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: "文件读取失败" });
    reader.readAsText(file);
  });
}

export function SettingsModal({
  open,
  onClose,
  prefs,
  onUpdate,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  t,
  onNotice,
  notifications,
  autoTheme,
  onAutoThemeChange,
  customTabLabels,
  onCustomTabLabelsChange,
}: {
  open: boolean;
  onClose: () => void;
  prefs: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: (key: TranslationKey) => string;
  onNotice: (msg: string) => void;
  notifications: {
    permission: NotificationPermission;
    enabled: boolean;
    request: () => Promise<NotificationPermission | "unsupported">;
    setEnabled: (enabled: boolean) => void;
  };
  autoTheme: boolean;
  onAutoThemeChange: (enabled: boolean) => void;
  customTabLabels?: { chat: string; image: string; video: string; assets: string };
  onCustomTabLabelsChange?: (labels: { chat: string; image: string; video: string; assets: string }) => void;
}) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="设置">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3><SettingsIcon size={16} /> {t("settings.title")}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t("common.close")}>
            <X size={18} />
          </button>
        </div>
        <div className="settings-content">
          <section className="settings-section">
            <h4>{t("settings.theme")}</h4>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={autoTheme}
                onChange={(e) => onAutoThemeChange(e.target.checked)}
              />
              <span>根据时间自动切换（白天亮色，夜晚暗色）</span>
            </label>
            <div className="settings-field">
              <label htmlFor="lang-select">{t("settings.language")}</label>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
              >
                <option value="zh">{t("language.zh")}</option>
                <option value="en">{t("language.en")}</option>
              </select>
            </div>
            {notifications.permission === "granted" ? (
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={notifications.enabled}
                  onChange={(e) => notifications.setEnabled(e.target.checked)}
                />
                <span>浏览器通知（视频完成时）</span>
              </label>
            ) : (
              <button
                type="button"
                className="ghost-button"
                onClick={async () => {
                  const result = await notifications.request();
                  if (result === "granted") onNotice("通知权限已开启。");
                  else if (result === "denied") onNotice("通知权限被拒绝。");
                  else onNotice("通知权限请求失败。");
                }}
              >
                开启浏览器通知
              </button>
            )}
            <div className="theme-picker-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-picker-card${theme === t.id ? " active" : ""}`}
                  onClick={() => onThemeChange(t.id)}
                  aria-pressed={theme === t.id}
                >
                  <span className={`theme-preview theme-preview-${t.id}`} aria-hidden="true" />
                  <strong>{t.label}</strong>
                  <span className="theme-picker-desc">{t.description}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <h4>{t("settings.image")}</h4>
            <div className="settings-field">
              <label htmlFor="image-size">默认尺寸</label>
              <select id="image-size" value={prefs.defaultImageSize} onChange={(e) => onUpdate("defaultImageSize", e.target.value as UserPreferences["defaultImageSize"])}>
                <option value="1024x1024">正方形 (1024×1024)</option>
                <option value="1024x768">横版 (1024×768)</option>
                <option value="768x1024">竖版 (768×1024)</option>
              </select>
            </div>
            <div className="settings-field">
              <label htmlFor="image-style">默认风格</label>
              <select id="image-style" value={prefs.defaultStyle} onChange={(e) => onUpdate("defaultStyle", e.target.value)}>
                <option value="none">无风格</option>
                <option value="realistic">写实</option>
                <option value="anime">动漫</option>
                <option value="oil">油画</option>
                <option value="watercolor">水彩</option>
                <option value="sketch">素描</option>
              </select>
            </div>
          </section>
          <section className="settings-section">
            <h4>{t("settings.video")}</h4>
            <div className="settings-field">
              <label htmlFor="video-preset">默认时长</label>
              <select id="video-preset" value={prefs.defaultVideoPreset} onChange={(e) => onUpdate("defaultVideoPreset", e.target.value as UserPreferences["defaultVideoPreset"])}>
                <option value="short">约 5 秒</option>
                <option value="standard">约 10 秒</option>
                <option value="max">拉满</option>
              </select>
            </div>
            <div className="settings-field">
              <label htmlFor="video-fps">默认帧率</label>
              <select id="video-fps" value={prefs.defaultVideoFps} onChange={(e) => onUpdate("defaultVideoFps", Number(e.target.value) as 24 | 30)}>
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
              </select>
            </div>
            <div className="settings-field">
              <label htmlFor="video-aspect">默认宽高比</label>
              <select id="video-aspect" value={prefs.defaultVideoAspect} onChange={(e) => onUpdate("defaultVideoAspect", e.target.value as UserPreferences["defaultVideoAspect"])}>
                <option value="1152x768">3:2 横版</option>
                <option value="1280x720">16:9 横版</option>
                <option value="720x1280">9:16 竖版</option>
                <option value="1920x1080">全高清</option>
              </select>
            </div>
          </section>
          <section className="settings-section">
            <h4>{t("settings.chat")}</h4>
            <div className="settings-field">
              <label htmlFor="tab-label-chat">聊天标签</label>
              <input
                id="tab-label-chat"
                type="text"
                placeholder="留空使用默认"
                value={prefs.customTabLabels.chat}
                maxLength={12}
                onChange={(e) => onUpdate("customTabLabels", { ...prefs.customTabLabels, chat: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="tab-label-image">图片标签</label>
              <input
                id="tab-label-image"
                type="text"
                placeholder="留空使用默认"
                value={prefs.customTabLabels.image}
                maxLength={12}
                onChange={(e) => onUpdate("customTabLabels", { ...prefs.customTabLabels, image: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="tab-label-video">视频标签</label>
              <input
                id="tab-label-video"
                type="text"
                placeholder="留空使用默认"
                value={prefs.customTabLabels.video}
                maxLength={12}
                onChange={(e) => onUpdate("customTabLabels", { ...prefs.customTabLabels, video: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="tab-label-assets">素材库标签</label>
              <input
                id="tab-label-assets"
                type="text"
                placeholder="留空使用默认"
                value={prefs.customTabLabels.assets}
                maxLength={12}
                onChange={(e) => onUpdate("customTabLabels", { ...prefs.customTabLabels, assets: e.target.value })}
              />
            </div>
            <label className="settings-toggle">
              <input type="checkbox" checked={prefs.autoSaveDraft} onChange={(e) => onUpdate("autoSaveDraft", e.target.checked)} />
              <span>自动保存草稿</span>
            </label>
            <label className="settings-toggle">
              <input type="checkbox" checked={prefs.showMessageTimestamps} onChange={(e) => onUpdate("showMessageTimestamps", e.target.checked)} />
              <span>显示消息时间戳</span>
            </label>
            <label className="settings-toggle">
              <input type="checkbox" checked={prefs.enableSoundEffects} onChange={(e) => onUpdate("enableSoundEffects", e.target.checked)} />
              <span>启用声音反馈</span>
            </label>
          </section>
          <section className="settings-section">
            <h4>设置配置</h4>
            <p className="settings-hint">导出/导入主题、语言、偏好等设置，便于多设备同步。</p>
            <SettingsProfileButtons
              theme={theme}
              language={language}
              prefs={prefs}
              customTabLabels={customTabLabels}
              autoTheme={autoTheme}
              onTheme={onThemeChange}
              onLanguage={onLanguageChange}
              onPrefs={onUpdate}
              onCustomTabLabels={onCustomTabLabelsChange}
              onAutoTheme={onAutoThemeChange}
              onNotice={onNotice}
            />
          </section>
          <section className="settings-section">
            <h4><Keyboard size={14} /> 快捷键</h4>
            <ShortcutsEditor />
          </section>
          <BackupRestore onNotice={onNotice} />
        </div>
        <div className="settings-footer">
          <span>{t("settings.saved")}</span>
          <button type="button" className="primary-button" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}

function SettingsProfileButtons({
  theme,
  language,
  prefs,
  customTabLabels,
  autoTheme,
  onTheme,
  onLanguage,
  onPrefs,
  onCustomTabLabels,
  onAutoTheme,
  onNotice,
}: {
  theme: ThemeId;
  language: Language;
  prefs: UserPreferences;
  customTabLabels?: { chat: string; image: string; video: string; assets: string };
  autoTheme: boolean;
  onTheme: (t: ThemeId) => void;
  onLanguage: (l: Language) => void;
  onPrefs: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  onCustomTabLabels?: (labels: { chat: string; image: string; video: string; assets: string }) => void;
  onAutoTheme: (enabled: boolean) => void;
  onNotice: (msg: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    exportSettingsProfile({
      theme,
      language,
      prefs,
      customTabLabels: customTabLabels ?? { chat: "", image: "", video: "", assets: "" },
      autoTheme,
    });
    onNotice("已导出设置配置");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importSettingsProfile(file, {
      onTheme,
      onLanguage,
      onPrefs: (next) => {
        (Object.keys(next) as Array<keyof UserPreferences>).forEach((k) => {
          onPrefs(k, next[k]);
        });
      },
      onCustomTabLabels,
      onAutoTheme,
    });
    if (result.ok) onNotice("已导入设置配置");
    else onNotice(`导入失败: ${result.error}`);
    e.target.value = "";
  };

  return (
    <div className="settings-profile-buttons">
      <button type="button" className="secondary-button" onClick={handleExport}>
        <Download size={14} /> 导出设置
      </button>
      <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
        <Upload size={14} /> 导入设置
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleImport}
      />
    </div>
  );
}

function ShortcutsEditor() {
  const { shortcuts, updateShortcut, resetShortcuts, format, labels } = useCustomShortcuts();
  const actions = Object.keys(labels) as ShortcutAction[];

  return (
    <div className="shortcuts-editor">
      <div className="shortcuts-list">
        {actions.map((action) => (
          <div key={action} className="shortcut-row">
            <span className="shortcut-label">{labels[action as keyof typeof labels]}</span>
            <input
              type="text"
              className="shortcut-input"
              value={shortcuts[action]}
              onChange={(e) => updateShortcut(action, e.target.value)}
              placeholder={shortcuts[action]}
            />
            <span className="shortcut-formatted">{format(action)}</span>
          </div>
        ))}
      </div>
      <button type="button" className="ghost-button" onClick={resetShortcuts}>
        恢复默认快捷键
      </button>
    </div>
  );
}
