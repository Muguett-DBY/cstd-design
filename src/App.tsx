import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
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
  ImageWorkspace,
  VideoWorkspace,
  AssetWorkspace,
  Lightbox,
  Sidebar,
  ConfirmDialog,
} from "./components";
import { useToast } from "./components/toast-context";

const CLEAR_LABELS: Record<ClearScope, string> = {
  all: "全部内容",
  chat: "全部咨询会话",
  image: "全部生成图片",
  video: "全部视频任务和视频素材",
  assets: "素材库全部文件",
};

function AppInner() {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lightboxAsset, setLightboxAsset] = useState<AssetItem | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("cstd-design:dark");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

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
    document.documentElement.classList.toggle("theme-dark", dark);
    localStorage.setItem("cstd-design:dark", String(dark));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#1a1410" : "#fffaf1");
  }, [dark]);

  useEffect(() => onUnauthorized(() => { setAuthenticated(false); }), []);

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
          toast(`已清空${label}：会话 ${result.deleted.conversations}，消息 ${result.deleted.messages}，素材 ${result.deleted.assets}，视频任务 ${result.deleted.videoTasks}。`, "success");
        } catch (error) {
          toast(error instanceof Error ? error.message : "操作失败。", "error");
        }
      },
    );
  }, [refreshAssets, refreshConversations, requestConfirm, toast]);

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
    if (!authenticated) return;
    const timer = window.setTimeout(() => refreshConversations("").catch(() => {}), 160);
    return () => window.clearTimeout(timer);
  }, [authenticated, refreshConversations]);

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

  const handleCreateConversation = async () => {
    try {
      const created = await api.createConversation();
      await refreshConversations("");
      await openConversation(created.conversation.id);
    } catch (error) { toast(error instanceof Error ? error.message : "请求失败。", "error"); }
  };

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
    dark,
    onThemeToggle: () => setDark((p) => !p),
    onLogout: handleLogout,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Sidebar {...sidebarProps} />
      </aside>
      <aside ref={mobileDrawerRef} className={mobileSidebarOpen ? "sidebar mobile-drawer open" : "sidebar mobile-drawer"} aria-hidden={!mobileSidebarOpen}>
        <Sidebar {...sidebarProps} />
      </aside>
      {mobileSidebarOpen && <button type="button" className="mobile-backdrop" aria-label="关闭会话列表" onClick={() => setMobileSidebarOpen(false)} />}

      {lightboxAsset && <Lightbox asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />}

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

      <main className="workspace">
        <ErrorBoundary>
        <TopBar activeTab={activeTab} onTabChange={setActiveTab} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        {activeTab === "chat" && (
          <ChatWorkspace
            conversation={conversation}
            messages={activeMessages}
            leaves={leaves}
            loading={loadingConversation}
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
          />
        )}
        {activeTab === "image" && <ImageWorkspace assets={assets} onAssetsChanged={refreshAssets} onNotice={(msg: string) => toast(msg, "info")} onClearAll={() => clearScope("image")} onPreview={setLightboxAsset} />}
        {activeTab === "video" && <VideoWorkspace assets={assets} onAssetsChanged={refreshAssets} onNotice={(msg: string) => toast(msg, "info")} onClearAll={() => clearScope("video")} onPreview={setLightboxAsset} />}
        {activeTab === "assets" && <AssetWorkspace assets={assets} onAssetsChanged={refreshAssets} onClearAll={() => clearScope("assets")} onNotice={(msg: string) => toast(msg, "info")} onPreview={setLightboxAsset} onRequestConfirm={requestConfirm} />}
        </ErrorBoundary>
      </main>

      <nav className="mobile-tabs" aria-label="移动端导航">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id as WorkspaceTab)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
