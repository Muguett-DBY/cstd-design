export const ONBOARDING_STORAGE_KEY = "cstd-design:onboardingComplete";
export const EXPORT_PREFERENCES_STORAGE_KEY = "cstd-design:export-preferences";
export const CREATION_RECOVERY_STORAGE_KEY = "cstd-design:creationRecovery:v1";
export const CREATION_ACTIVITY_STORAGE_KEY = "cstd-design:creationActivity:v1";
export const ASSET_SORT_STORAGE_KEY = "cstd-design:assetSortMode";

export const BACKUP_KEYS: readonly string[] = [
  "cstd-design:chat-prompt-templates",
  "cstd-design:video-presets",
  "cstd-design:pinned-conversations",
  "cstd-design:asset-tags",
  "cstd-design:preferences",
  "cstd-design:theme",
  "cstd-design:language",
  "cstd-design:saved-searches",
  "cstd-design:shared-conversations",
  "cstd-design:searchHistory",
  "cstd-design:imageSize",
  ONBOARDING_STORAGE_KEY,
  EXPORT_PREFERENCES_STORAGE_KEY,
  CREATION_RECOVERY_STORAGE_KEY,
  CREATION_ACTIVITY_STORAGE_KEY,
  ASSET_SORT_STORAGE_KEY,
  "cstd-design:dark",
] as const;

export const BACKUP_KEY_LABELS: Record<string, string> = {
  "cstd-design:chat-prompt-templates": "咨询提示词模板",
  "cstd-design:video-presets": "视频预设",
  "cstd-design:pinned-conversations": "置顶会话",
  "cstd-design:asset-tags": "素材标签",
  "cstd-design:preferences": "工作台偏好",
  "cstd-design:theme": "主题",
  "cstd-design:language": "语言",
  "cstd-design:saved-searches": "已保存搜索",
  "cstd-design:shared-conversations": "已分享对话",
  "cstd-design:searchHistory": "搜索历史",
  "cstd-design:imageSize": "图片尺寸",
  [ONBOARDING_STORAGE_KEY]: "新手引导状态",
  [EXPORT_PREFERENCES_STORAGE_KEY]: "导出偏好",
  [CREATION_RECOVERY_STORAGE_KEY]: "恢复备份",
  [CREATION_ACTIVITY_STORAGE_KEY]: "恢复记录",
  [ASSET_SORT_STORAGE_KEY]: "素材排序偏好",
  "cstd-design:dark": "深色模式",
};
