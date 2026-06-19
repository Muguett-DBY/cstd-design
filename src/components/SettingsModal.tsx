import { Settings as SettingsIcon, X } from "lucide-react";
import type { UserPreferences } from "../hooks/useUserPreferences";

export function SettingsModal({
  open,
  onClose,
  prefs,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  prefs: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="设置">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3><SettingsIcon size={16} /> 偏好设置</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="settings-content">
          <section className="settings-section">
            <h4>图片生成</h4>
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
            <h4>视频生成</h4>
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
            <h4>聊天</h4>
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
        </div>
        <div className="settings-footer">
          <span>设置会自动保存</span>
          <button type="button" className="primary-button" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  );
}
