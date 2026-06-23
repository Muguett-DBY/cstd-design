export const ONBOARDING_STORAGE_KEY = "cstd-design:onboardingComplete";

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
  "cstd-design:dark",
] as const;
