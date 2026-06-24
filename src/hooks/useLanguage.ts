import { useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:language";

export type Language = "zh" | "en";

type TranslationKey =
  | "common.save" | "common.cancel" | "common.delete" | "common.edit" | "common.close" | "common.create" | "common.search"
  | "common.settings" | "common.confirm" | "common.yes" | "common.no" | "common.deleteConfirm"
  | "nav.chat" | "nav.image" | "nav.video" | "nav.assets"
  | "topbar.chatDesc" | "topbar.imageDesc" | "topbar.videoDesc" | "topbar.assetsDesc"
  | "settings.title" | "settings.theme" | "settings.image" | "settings.video" | "settings.chat" | "settings.appearance"
  | "settings.language" | "settings.saved" | "settings.autoTheme" | "settings.shortcuts" | "settings.notifications" | "settings.importExport"
  | "command.placeholder" | "command.empty" | "command.searchActions"
  | "search.placeholder" | "search.noResults" | "search.semantic"
  | "empty.chatTitle" | "empty.chatDesc" | "empty.noSearch" | "empty.noConversations" | "empty.noAssets"
  | "language.zh" | "language.en"
  | "offline.title" | "offline.hint" | "online.title"
  | "prompt.library" | "prompt.addCustom" | "prompt.favorites" | "prompt.search"
  | "template.export" | "template.import" | "backup.export" | "backup.import" | "backup.preview"
  | "onboarding.welcome" | "onboarding.chat" | "onboarding.image" | "onboarding.assets" | "onboarding.search";

const translations: Record<Language, Record<TranslationKey, string>> = {
  zh: {
    "common.save": "保存",
    "common.cancel": "取消",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.close": "关闭",
    "common.create": "创建",
    "common.search": "搜索",
    "common.settings": "设置",
    "common.confirm": "确认",
    "common.yes": "是",
    "common.no": "否",
    "common.deleteConfirm": "确认永久删除？此操作不可恢复。",
    "nav.chat": "咨询",
    "nav.image": "图片",
    "nav.video": "视频",
    "nav.assets": "素材库",
    "topbar.chatDesc": "安静地问，清楚地答。",
    "topbar.imageDesc": "输入想法，生成一张图。",
    "topbar.videoDesc": "页面保持打开，等待视频完成。",
    "topbar.assetsDesc": "管理你的上传和作品。",
    "settings.title": "偏好设置",
    "settings.theme": "主题外观",
    "settings.image": "图片生成",
    "settings.video": "视频生成",
    "settings.chat": "聊天",
    "settings.appearance": "外观",
    "settings.language": "界面语言",
    "settings.saved": "设置会自动保存",
    "command.placeholder": "搜索操作、对话、页面...",
    "command.empty": "没有匹配的命令",
    "command.searchActions": "搜索操作、对话、页面",
    "search.placeholder": "搜索消息内容...",
    "search.noResults": "无结果",
    "empty.chatTitle": "开始你的第一次对话",
    "empty.chatDesc": "输入问题、想法或任务描述，助手会给出回答。所有会话都保留在你的本地工作区。",
    "empty.noSearch": "未找到匹配的会话",
    "empty.noConversations": "还没有会话",
    "empty.noAssets": "还没有素材",
    "language.zh": "中文",
    "language.en": "English",
    "settings.autoTheme": "自动主题",
    "settings.shortcuts": "快捷键",
    "settings.notifications": "通知",
    "settings.importExport": "导入/导出",
    "search.semantic": "语义搜索",
    "offline.title": "离线模式",
    "offline.hint": "（已缓存，可继续使用）",
    "online.title": "已恢复在线",
    "prompt.library": "提示词库",
    "prompt.addCustom": "添加自定义",
    "prompt.favorites": "收藏",
    "prompt.search": "搜索提示词...",
    "template.export": "导出",
    "template.import": "导入",
    "backup.export": "导出备份",
    "backup.import": "导入备份",
    "backup.preview": "预览",
    "onboarding.welcome": "欢迎使用 cstd-design",
    "onboarding.chat": "开始对话",
    "onboarding.image": "生成图片",
    "onboarding.assets": "管理素材",
    "onboarding.search": "使用搜索",
  },
  en: {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.create": "Create",
    "common.search": "Search",
    "common.settings": "Settings",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.deleteConfirm": "Are you sure? This cannot be undone.",
    "nav.chat": "Chat",
    "nav.image": "Image",
    "nav.video": "Video",
    "nav.assets": "Assets",
    "topbar.chatDesc": "Ask quietly, answer clearly.",
    "topbar.imageDesc": "Describe your idea, generate an image.",
    "topbar.videoDesc": "Keep this page open while the video generates.",
    "topbar.assetsDesc": "Manage your uploads and creations.",
    "settings.title": "Preferences",
    "settings.theme": "Theme & Appearance",
    "settings.image": "Image Generation",
    "settings.video": "Video Generation",
    "settings.chat": "Chat",
    "settings.appearance": "Appearance",
    "settings.language": "Interface Language",
    "settings.saved": "Settings are saved automatically",
    "settings.autoTheme": "Auto Theme",
    "settings.shortcuts": "Keyboard Shortcuts",
    "settings.notifications": "Notifications",
    "settings.importExport": "Import/Export",
    "search.semantic": "Semantic Search",
    "offline.title": "Offline Mode",
    "offline.hint": "(cached, can continue)",
    "online.title": "Back Online",
    "prompt.library": "Prompt Library",
    "prompt.addCustom": "Add Custom",
    "prompt.favorites": "Favorites",
    "prompt.search": "Search prompts...",
    "template.export": "Export",
    "template.import": "Import",
    "backup.export": "Export Backup",
    "backup.import": "Import Backup",
    "backup.preview": "Preview",
    "onboarding.welcome": "Welcome to cstd-design",
    "onboarding.chat": "Start a conversation",
    "onboarding.image": "Generate images",
    "onboarding.assets": "Manage assets",
    "onboarding.search": "Use search",
    "command.placeholder": "Search actions, conversations, pages...",
    "command.empty": "No matching commands",
    "command.searchActions": "Search actions, conversations, pages",
    "search.placeholder": "Search messages...",
    "search.noResults": "No results",
    "empty.chatTitle": "Start your first conversation",
    "empty.chatDesc": "Type a question, idea, or task. The assistant will respond. All conversations stay in your local workspace.",
    "empty.noSearch": "No matching conversations",
    "empty.noConversations": "No conversations yet",
    "empty.noAssets": "No assets yet",
    "language.zh": "Chinese",
    "language.en": "English",
  },
};

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") return stored;
  } catch {
    // ignore
  }
  if (typeof navigator !== "undefined") {
    return navigator.language.startsWith("zh") ? "zh" : "en";
  }
  return "zh";
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next: Language) => setLanguageState(next);
  const t = (key: TranslationKey): string => translations[language][key] || key;

  return { language, setLanguage, t };
}

export type { TranslationKey };
