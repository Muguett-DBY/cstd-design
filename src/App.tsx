import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { api, onUnauthorized } from "./api";
import { appendChatEvent, buildActiveBranch, branchLeaves } from "./app-state";
import { TABS } from "./constants";
import type { AssetItem, ChatStreamEvent, ClearScope, ConversationDetail, ConversationSummary, WorkspaceTab } from "./types";
import {
  ErrorBoundary,
  Splash,
  LoginPage,
  TopBar,
  ChatWorkspace,
  Sidebar,
  ConfirmDialog,
  RecoveryCenter,
} from "./components";
import { useToast } from "./components/toast-context";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useVideoTaskPersistence } from "./hooks/useVideoTaskPersistence";
import { NetworkBanner } from "./components/NetworkBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { OnboardingTour } from "./components/OnboardingTour";
import { ONBOARDING_STORAGE_KEY } from "./storage-keys";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { GlobalDropZone } from "./components/GlobalDropZone";
import { SettingsModal } from "./components/SettingsModal";
import { useUserPreferences } from "./hooks/useUserPreferences";
import { useTheme, type ThemeId } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import { useShortcutsHelp } from "./hooks/useShortcutsHelp";
import { useNotifications } from "./hooks/useNotifications";
import { SharedConversationsModal, SharedRoute } from "./components/SharedConversationsModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { VideoTasksPanel } from "./components/VideoTasksPanel";
import { useVideoTaskHistory } from "./hooks/useVideoTaskHistory";
import { ImageEditor } from "./components/ImageEditor";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { useUsageStats } from "./hooks/useUsageStats";
import { useCreationRecovery, type CreationRecoveryRecord } from "./hooks/useCreationRecovery";
import { deriveCreationCenterHighlights } from "./creation-center-model";
import { MessageSquare, Image as ImageIcon, Video, Folder, Hash, Sparkles, Settings, FileText, Keyboard } from "lucide-react";

const ImageWorkspace = lazy(() => import("./components/ImageWorkspace").then((m) => ({ default: m.ImageWorkspace })));
const VideoWorkspace = lazy(() => import("./components/VideoWorkspace").then((m) => ({ default: m.VideoWorkspace })));
const AssetWorkspace = lazy(() => import("./components/AssetWorkspace").then((m) => ({ default: m.AssetWorkspace })));
const Lightbox = lazy(() => import("./components/Lightbox").then((m) => ({ default: m.Lightbox })));

const CLEAR_LABELS: Record<ClearScope, string> = {
  all: "全部内容",
  chat: "全部咨询会话",
  image: "全部生成图片",
  video: "全部视频任务和视频素材",
  assets: "素材库全部文件",
};

function AppInner() {
  const { toast } = useToast();
  const { online, checkOnline } = useNetworkStatus();
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lightboxAsset, setLightboxAsset] = useState<AssetItem | null>(null);
  const [lightboxAssets, setLightboxAssets] = useState<AssetItem[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const { task: videoTask, setTask: setVideoTask } = useVideoTaskPersistence();
  const [videoSubmittedPrompt, setVideoSubmittedPrompt] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const shortcutsHelp = useShortcutsHelp();
  const userPrefs = useUserPreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sharedOpen, setSharedOpen] = useState(false);
  const [showShareRoute, setShowShareRoute] = useState(() => /^#share\//.test(window.location.hash));

  useEffect(() => {
    const handler = () => {
      setShowShareRoute(/^#share\//.test(window.location.hash));
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const { theme, setTheme, autoMode, setAutoMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const notifications = useNotifications();
  const videoHistory = useVideoTaskHistory();
  const usageStats = useUsageStats();
  const { records: recoveryRecords, upsert: upsertRecovery, dismiss: dismissRecovery, clear: clearRecovery } = useCreationRecovery();
  const [selectedRecovery, setSelectedRecovery] = useState<CreationRecoveryRecord | null>(null);
  const creationHighlights = useMemo(
    () => deriveCreationCenterHighlights({ conversations, assets, videoHistory: videoHistory.history }),
    [assets, conversations, videoHistory.history],
  );
  const autoTheme = autoMode;
  const onAutoThemeChange = setAutoMode;

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", danger: false, onConfirm: () => {} });

  const requestConfirm = useCallback((title: string, message: string, danger: boolean, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, danger, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors: Record<ThemeId, string> = {
      light: "#fffaf1",
      dark: "#1a1410",
      sepia: "#faf2e0",
      ocean: "#f4fafc",
      forest: "#f4f9f4",
      night: "#0d1117",
    };
    if (meta) meta.setAttribute("content", colors[theme] || "#fffaf1");
  }, [theme]);

  useEffect(() => onUnauthorized(() => { setAuthenticated(false); }), []);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (Date.now() - touchStartTime > 400) return;
      const t = e.changedTouches[0];
      const deltaX = t.clientX - touchStartX;
      const deltaY = Math.abs(t.clientY - touchStartY);
      if (deltaY > 80) return;
      if (deltaX > 60 && touchStartX < 40 && !mobileSidebarOpen) {
        setMobileSidebarOpen(true);
      } else if (deltaX < -60 && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [mobileSidebarOpen]);

  const mobileDrawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const drawer = mobileDrawerRef.current;
    if (!drawer) return;
    const focusable = drawer.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = drawer.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    drawer.addEventListener("keydown", handler);
    window.addEventListener("keydown", escapeHandler);
    document.body.style.overflow = "hidden";
    return () => {
      drawer.removeEventListener("keydown", handler);
      window.removeEventListener("keydown", escapeHandler);
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const refreshConversations = useCallback(async (q = "") => {
    try {
      const result = await api.conversations(q);
      setConversations(result.conversations);
    } catch (error) {
      toast(error instanceof Error ? error.message : "请求失败。", "error");
    }
  }, [toast]);

  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const openLightbox = useCallback((asset: AssetItem) => {
    setLightboxAsset(asset);
    setLightboxAssets(assets);
  }, [assets]);

  const handleEditAsset = useCallback((asset: AssetItem) => {
    setEditingAsset(asset);
  }, []);

  const refreshAssets = useCallback(async () => {
    try {
      const result = await api.assets();
      setAssets(result.assets);
    } catch (error) {
      toast(error instanceof Error ? error.message : "请求失败。", "error");
    }
  }, [toast]);

  const openConversation = useCallback(async (id: string) => {
    setLoadingConversation(true);
    try {
      const result = await api.conversation(id);
      setConversation(result.conversation);
      setActiveTab("chat");
    } catch (error) {
      toast(error instanceof Error ? error.message : "请求失败。", "error");
    } finally {
      setLoadingConversation(false);
    }
  }, [toast]);

  const handleCreateConversation = useCallback(async () => {
    try {
      const created = await api.createConversation();
      await refreshConversations("");
      await openConversation(created.conversation.id);
    } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
  }, [openConversation, refreshConversations, toast]);

  const clearScope = useCallback(async (scope: ClearScope) => {
    const label = CLEAR_LABELS[scope];
    requestConfirm(
      `清空${label}`,
      `确认永久清空${label}？这个操作会删除数据库记录和相关文件，不能恢复。`,
      true,
      async () => {
        try {
          const result = await api.clearScope(scope);
          if (scope === "chat" || scope === "all") {
            setConversation(null);
            await refreshConversations("");
          }
          if (scope === "image" || scope === "video" || scope === "assets" || scope === "all") {
            await refreshAssets();
          }
          if (scope === "video" || scope === "all") {
            setVideoTask(null);
          }
          toast(`已清空${label}：会话 ${result.deleted.conversations}，消息 ${result.deleted.messages}，素材 ${result.deleted.assets}，视频任务 ${result.deleted.videoTasks}。`, "success");
        } catch (error) {
          toast(error instanceof Error ? error.message : "操作失败。", "error");
        }
      },
    );
  }, [refreshAssets, refreshConversations, requestConfirm, toast, setVideoTask]);

  useEffect(() => {
    api
      .session()
      .then(async (session) => {
        setAuthenticated(session.authenticated);
        if (session.authenticated) {
          await Promise.all([refreshConversations(""), refreshAssets()]);
        }
      })
      .finally(() => setBooting(false));
  }, [refreshAssets, refreshConversations]);

  useEffect(() => {
    if (videoTask && videoTask.status === "completed") {
      notifications.send("视频生成完成", `视频 ${videoTask.id.slice(0, 8)} 已完成`);
      videoHistory.add({
        id: videoTask.id,
        prompt: videoSubmittedPrompt || "视频",
        status: "completed",
        finishedAt: new Date().toISOString(),
        assetUrl: videoTask.assetUrl,
      });
    } else if (videoTask && videoTask.status === "failed") {
      notifications.send("视频生成失败", `视频 ${videoTask.id.slice(0, 8)} 失败，请重试`);
      videoHistory.add({
        id: videoTask.id,
        prompt: videoSubmittedPrompt || "视频",
        status: "failed",
        finishedAt: new Date().toISOString(),
      });
    }
  }, [videoTask, notifications, videoHistory, videoSubmittedPrompt]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => refreshConversations("").catch(() => {}), 160);
    return () => window.clearTimeout(timer);
  }, [authenticated, refreshConversations]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const commandItems: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = (TABS as readonly { id: string; label: string }[]).map((tab) => ({
      id: `nav-${tab.id}`,
      label: `前往 ${tab.label}`,
      description: `切换到 ${tab.label} 页面`,
      icon: tab.id === "chat" ? MessageSquare : tab.id === "image" ? ImageIcon : tab.id === "video" ? Video : Folder,
      group: "navigation",
      keywords: ["tab", "switch", "page", tab.label],
      perform: () => setActiveTab(tab.id as WorkspaceTab),
    }));

    const convItems: CommandItem[] = conversations.slice(0, 10).map((c) => ({
      id: `conv-${c.id}`,
      label: c.title || "新会话",
      description: `${c.messageCount || 0} 条消息`,
      icon: Hash,
      group: "conversation",
      keywords: ["session", "chat"],
      perform: () => { void openConversation(c.id); },
    }));

    const actionItems: CommandItem[] = [
      {
        id: "action-new",
        label: "新建对话",
        description: "创建一个新的会话",
        icon: Sparkles,
        group: "action",
        shortcut: "Ctrl+N",
        keywords: ["new", "create", "session"],
        perform: () => { void handleCreateConversation(); },
      },
      {
        id: "action-onboarding",
        label: "查看引导",
        description: "重新查看 5 步引导",
        icon: FileText,
        group: "action",
        keywords: ["tutorial", "help", "guide"],
        perform: () => { try { localStorage.removeItem(ONBOARDING_STORAGE_KEY); window.location.reload(); } catch { /* ignore */ } },
      },
      {
        id: "action-theme",
        label: "切换主题",
        description: "在亮色和暗色之间切换",
        icon: Settings,
        group: "action",
        keywords: ["dark", "light", "theme"],
        perform: () => { setTheme(theme === "dark" ? "light" : "dark"); },
      },
      ...[
        { id: "theme-sepia", name: "复古护眼", perform: () => setTheme("sepia") },
        { id: "theme-ocean", name: "海洋蓝", perform: () => setTheme("ocean") },
        { id: "theme-forest", name: "森林绿", perform: () => setTheme("forest") },
        { id: "theme-night", name: "深夜模式", perform: () => setTheme("night") },
      ].map((t) => ({
        id: t.id,
        label: `主题：${t.name}`,
        description: `切换到 ${t.name} 主题`,
        icon: Settings,
        group: "action" as const,
        keywords: ["theme", t.name, t.id],
        perform: t.perform,
      })),
      {
        id: "action-shortcuts",
        label: "查看快捷键",
        description: "显示所有键盘快捷键",
        icon: Keyboard,
        group: "action",
        shortcut: "Ctrl+/",
        keywords: ["help", "shortcut", "keyboard", "key"],
        perform: () => { shortcutsHelp.setOpen(true); },
      },
      {
        id: "action-settings",
        label: "偏好设置",
        description: "默认尺寸、风格、帧率等",
        icon: Settings,
        group: "action",
        keywords: ["settings", "preferences", "config", "options"],
        perform: () => { setSettingsOpen(true); },
      },
      {
        id: "action-share",
        label: "分享对话",
        description: "为当前对话生成分享链接",
        icon: Settings,
        group: "action",
        keywords: ["share", "link", "public"],
        perform: () => { setSharedOpen(true); },
      },
    ];

    return [...navItems, ...convItems, ...actionItems];
  }, [conversations, openConversation, handleCreateConversation, shortcutsHelp, theme, setTheme]);

  const selectRecoveryRecord = useCallback((record: CreationRecoveryRecord) => {
    setSelectedRecovery(record);
    setActiveTab(record.workspace);
    toast(`已恢复到${record.workspace === "chat" ? "咨询" : record.workspace === "image" ? "图片" : "视频"}工作区。确认创作成功后，可在创作中心忽略该备份。`, "info");
  }, [toast]);

  const resolveSelectedRecovery = useCallback(() => {
    if (!selectedRecovery) return;
    dismissRecovery(selectedRecovery.id);
    setSelectedRecovery(null);
    toast("恢复创作已完成，备份已自动清理。", "success");
  }, [dismissRecovery, selectedRecovery, toast]);

  if (booting) return <Splash />;
  if (!authenticated) {
    return (
      <LoginPage
        onLogin={async (password: string) => {
          await api.login(password);
          setBooting(true);
          setAuthenticated(true);
          await Promise.all([refreshConversations(""), refreshAssets()]);
          setBooting(false);
        }}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await api.logout();
      setAuthenticated(false);
    } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
  };

  const activeConversationId = conversation?.id || null;
  const activeMessages = buildActiveBranch(conversation?.messages || [], conversation?.activeLeafId);
  const leaves = branchLeaves(conversation?.messages || []);

  const sidebarProps = {
    activeTab,
    onTabChange: (tab: WorkspaceTab) => { setActiveTab(tab); setMobileSidebarOpen(false); },
    conversations,
    activeConversationId,
    onSearch: (q: string) => { void refreshConversations(q); },
    onSelectConversation: async (id: string) => { await openConversation(id); setMobileSidebarOpen(false); },
    onCreateConversation: async () => { await handleCreateConversation(); setMobileSidebarOpen(false); },
    onImportConversation: async (data: { title: string; messages: { role: string; content: string; createdAt?: string }[] }) => {
      try {
        const result = await api.createConversation();
        const convId = result.conversation.id;
        await api.renameConversation(convId, data.title);
        await refreshConversations("");
        await openConversation(convId);
        toast(`已创建新对话，标题：${data.title}（共 ${data.messages.length} 条消息）。`);
      } catch (error) {
        toast(error instanceof Error ? error.message : "导入失败。", "error");
      }
    },
    onDeleteConversation: async (id: string) => {
      try {
        await api.deleteConversation(id);
        if (conversation?.id === id) setConversation(null);
        await refreshConversations("");
      } catch (error) { toast(error instanceof Error ? error.message : "删除失败。", "error"); }
    },
    onBulkDelete: async (ids: string[]) => {
      try {
        for (const id of ids) {
          await api.deleteConversation(id);
          if (conversation?.id === id) setConversation(null);
        }
        await refreshConversations("");
        toast(`已删除 ${ids.length} 个对话。`);
      } catch (error) { toast(error instanceof Error ? error.message : "批量删除失败。", "error"); }
    },
    onRequestConfirm: requestConfirm,
    onNotice: (msg: string) => toast(msg, "info"),
    dark: theme === "dark" || theme === "night",
    onThemeToggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    onLogout: handleLogout,
  };

  if (showShareRoute) {
    return (
      <div className="app-shell">
        <SharedRoute />
      </div>
    );
  }

  return (
    <ErrorBoundary onError={(error, info) => {
      console.error("App error:", error, info);
    }}>
      <div className="app-shell">
        <a href="#main-content" className="skip-to-content">跳转到主要内容</a>
        <NetworkBanner online={online} onRetry={checkOnline} />
        <OfflineIndicator />
        <RecoveryCenter
          records={recoveryRecords}
          activeVideoTask={videoTask}
          recentVideoTasks={creationHighlights.completedVideoTasks}
          recentConversation={creationHighlights.latestConversation}
          recentImage={creationHighlights.latestImage}
          onSelect={selectRecoveryRecord}
          onDismiss={dismissRecovery}
          onClear={clearRecovery}
          onOpenVideoTask={() => setActiveTab("video")}
          onContinueConversation={(id) => { void openConversation(id); }}
          onOpenRecentImage={openLightbox}
          onStartWorkspace={setActiveTab}
        />
      <aside className="sidebar">
        <Sidebar {...sidebarProps} />
      </aside>
      <aside ref={mobileDrawerRef} className={mobileSidebarOpen ? "sidebar mobile-drawer open" : "sidebar mobile-drawer"} aria-hidden={!mobileSidebarOpen}>
        <Sidebar {...sidebarProps} />
      </aside>
      {mobileSidebarOpen && <button type="button" className="mobile-backdrop" aria-label="关闭会话列表" onClick={() => setMobileSidebarOpen(false)} />}

      {lightboxAsset && <Suspense fallback={null}><Lightbox key={lightboxAsset.id} assets={lightboxAssets.length ? lightboxAssets : [lightboxAsset]} startIndex={lightboxAssets.indexOf(lightboxAsset) >= 0 ? lightboxAssets.indexOf(lightboxAsset) : 0} onClose={() => { setLightboxAsset(null); setLightboxAssets([]); }} onEdit={handleEditAsset} /></Suspense>}
      {editingAsset && (
        <ImageEditor
          src={editingAsset.url}
          onClose={() => setEditingAsset(null)}
          onNotice={(msg: string) => toast(msg, "info")}
          onSave={async (blob) => {
            try {
              const filename = `edited-${editingAsset.filename}`;
              const file = new File([blob], filename, { type: "image/png" });
              await api.upload([file]);
              await refreshAssets();
              toast("编辑后的图片已保存到素材库。");
              setEditingAsset(null);
            } catch (error) {
              toast(error instanceof Error ? error.message : "保存失败。", "error");
            }
          }}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        danger={confirmState.danger}
        confirmLabel={confirmState.danger ? "确认删除" : "确认"}
        onConfirm={async () => {
          const action = confirmState.onConfirm;
          closeConfirm();
          await action();
        }}
        onCancel={closeConfirm}
      />

      <OnboardingTour />

      <GlobalDropZone
        onUploaded={refreshAssets}
        onNotice={(msg) => toast(msg, "info")}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={commandItems}
      />

      <GlobalSearchModal
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        conversations={conversations}
        activeMessages={activeMessages}
        assets={assets}
        onSelectConversation={(id) => { void openConversation(id); }}
        onSelectAsset={openLightbox}
      />

      <KeyboardShortcutsHelp
        open={shortcutsHelp.open}
        onClose={() => shortcutsHelp.setOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={userPrefs.prefs}
        onUpdate={userPrefs.update}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
        onNotice={(msg: string) => toast(msg, "info")}
        notifications={notifications}
        autoTheme={autoTheme}
        onAutoThemeChange={onAutoThemeChange}
        customTabLabels={userPrefs.prefs.customTabLabels}
        onCustomTabLabelsChange={(labels) => userPrefs.update("customTabLabels", labels)}
      />

      <SharedConversationsModal
        open={sharedOpen}
        onClose={() => setSharedOpen(false)}
        title={conversation?.title}
        messages={conversation?.messages?.filter((m) => m.status !== "streaming").map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }))}
        onNotice={(msg: string) => toast(msg, "info")}
      />

      <main className="workspace">
        <TopBar activeTab={activeTab} onTabChange={setActiveTab} onOpenSidebar={() => setMobileSidebarOpen(true)} t={t} customLabels={userPrefs.prefs.customTabLabels} />
        {activeTab === "chat" && (
          <ErrorBoundary key="chat">
          <ChatWorkspace
            key={`${conversation?.id || "new"}-${selectedRecovery?.type === "chat" ? selectedRecovery.id : ""}`}
            conversation={conversation}
            messages={activeMessages}
            leaves={leaves}
            loading={loadingConversation}
            allConversations={conversations}
            allAssets={assets}
            onRecordUsage={usageStats.record}
            usageStats={usageStats.stats}
            usageEvents={usageStats.stats.events}
            onCreate={async () => {
              try {
                const created = await api.createConversation();
                await refreshConversations("");
                await openConversation(created.conversation.id);
              } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
            }}
            onRename={async (title: string) => {
              if (!conversation) return;
              try {
                await api.renameConversation(conversation.id, title);
                await refreshConversations("");
                await openConversation(conversation.id);
              } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
            }}
            onDelete={async () => {
              if (!conversation) return;
              requestConfirm(
                "删除会话",
                `确认删除会话"${conversation.title}"？此操作不可恢复。`,
                true,
                async () => {
                  try {
                    await api.deleteConversation(conversation.id);
                    setConversation(null);
                    await refreshConversations("");
                    toast("会话已删除。", "success");
                  } catch (error) { toast(error instanceof Error ? error.message : "删除失败。", "error"); }
                },
              );
            }}
            onBranch={async (leafId: string) => {
              if (!conversation) return;
              try {
                setConversation({ ...conversation, activeLeafId: leafId });
                await api.switchConversationBranch(conversation.id, leafId);
              } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
            }}
            onStreamEvent={(event: ChatStreamEvent, pendingContent: string) => {
              if (event.type === "meta") {
                setConversation((current) => {
                  const base = current || {
                    id: event.conversationId,
                    title: pendingContent.slice(0, 24) || "新会话",
                    activeLeafId: event.assistantMessageId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [],
                  };
                  return {
                    ...base,
                    id: event.conversationId,
                    activeLeafId: event.assistantMessageId,
                    messages: [
                      ...base.messages,
                      { id: event.userMessageId, role: "user", content: pendingContent, status: "complete" as const, parentId: null },
                      { id: event.assistantMessageId, role: "assistant", content: event.truncated ? "（本轮已自动裁剪较早上下文）\n\n" : "", status: "streaming" as const, parentId: event.userMessageId },
                    ],
                  };
                });
              } else {
                setConversation((current) =>
                  current
                    ? { ...current, activeLeafId: event.assistantMessageId, messages: appendChatEvent(current.messages, event) }
                    : current,
                );
              }
            }}
            afterSend={async (conversationId: string) => {
              await refreshConversations("");
              await openConversation(conversationId);
            }}
            onClearAll={() => clearScope("all")}
            onNotice={(msg: string) => toast(msg, "info")}
            onRecordRecovery={upsertRecovery}
            initialRecoveryPayload={selectedRecovery?.type === "chat" ? selectedRecovery.payload : null}
            onRecoveryResolved={selectedRecovery?.type === "chat" ? resolveSelectedRecovery : undefined}
          />
          </ErrorBoundary>
        )}
        {activeTab === "image" && (
          <ErrorBoundary key="image">
          <Suspense fallback={<div className="messages-skeleton"><div className="message-skeleton"><div className="skeleton-avatar" /><div className="skeleton-body"><div className="skeleton-line" /></div></div></div>}>
          <ImageWorkspace
            key={selectedRecovery?.type === "image" ? selectedRecovery.id : "image"}
            assets={assets}
            onAssetsChanged={refreshAssets}
            onNotice={(msg: string) => toast(msg, "info")}
            onClearAll={() => clearScope("image")}
            onPreview={openLightbox}
            online={online}
            onRecordRecovery={upsertRecovery}
            initialRecoveryPayload={selectedRecovery?.type === "image" ? selectedRecovery.payload : null}
            onRecoveryResolved={selectedRecovery?.type === "image" ? resolveSelectedRecovery : undefined}
          />
          </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === "video" && (
          <ErrorBoundary key="video">
          <Suspense fallback={<div className="messages-skeleton"><div className="message-skeleton"><div className="skeleton-avatar" /><div className="skeleton-body"><div className="skeleton-line" /></div></div></div>}>
          <VideoWorkspace
            key={selectedRecovery?.type === "video" ? selectedRecovery.id : "video"}
            assets={assets}
            onAssetsChanged={refreshAssets}
            onNotice={(msg: string) => toast(msg, "info")}
            onClearAll={() => clearScope("video")}
            onPreview={openLightbox}
            videoTask={videoTask}
            onVideoTaskChange={setVideoTask}
            submittedPrompt={videoSubmittedPrompt}
            onSubmittedPromptChange={setVideoSubmittedPrompt}
            online={online}
            onRecordRecovery={upsertRecovery}
            initialRecoveryPayload={selectedRecovery?.type === "video" ? selectedRecovery.payload : null}
            onRecoveryResolved={selectedRecovery?.type === "video" ? resolveSelectedRecovery : undefined}
          />
          <VideoTasksPanel
            history={videoHistory.history}
            onRemove={videoHistory.remove}
            onClear={videoHistory.clear}
            activeTaskId={videoTask && (videoTask.status === "in_progress" || videoTask.status === "queued") ? videoTask.id : undefined}
          />
          </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === "assets" && (
          <ErrorBoundary key="assets">
          <Suspense fallback={<div className="messages-skeleton"><div className="message-skeleton"><div className="skeleton-avatar" /><div className="skeleton-body"><div className="skeleton-line" /></div></div></div>}>
          <AssetWorkspace assets={assets} onAssetsChanged={refreshAssets} onClearAll={() => clearScope("assets")} onNotice={(msg: string) => toast(msg, "info")} onPreview={openLightbox} onRequestConfirm={requestConfirm} />
          </Suspense>
          </ErrorBoundary>
        )}
        </main>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        customLabels={userPrefs.prefs.customTabLabels}
      />

    </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppInner />;
}
