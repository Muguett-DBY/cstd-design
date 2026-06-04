import { useCallback, useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  Bot,
  Check,
  Copy,
  Edit3,
  Film,
  Folder,
  ImageIcon,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "./App.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import { api, streamChat } from "./api";
import { appendChatEvent, buildActiveBranch, filterAssets, formatBytes, initialChatDraft, videoPresetToRequest } from "./app-state";
import type { AssetFilter, AssetItem, ChatMessage, ChatStreamEvent, ClearScope, ConversationDetail, ConversationSummary, ImageSize, VideoPreset, WorkspaceTab } from "./types";

const tabs: { id: WorkspaceTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "咨询", icon: MessageCircle },
  { id: "image", label: "图片", icon: ImageIcon },
  { id: "video", label: "视频", icon: Film },
  { id: "assets", label: "素材库", icon: Folder },
];

const APP_NAME = "工作台";
const ASSISTANT_NAME = "助手";
const IMAGE_SIZE_STORAGE_KEY = "cstd-design:imageSize";
const IMAGE_SIZES: ImageSize[] = ["1024x1024", "1024x768", "768x1024"];
const CLEAR_LABELS: Record<ClearScope, string> = {
  all: "全部内容",
  chat: "全部咨询会话",
  image: "全部生成图片",
  video: "全部视频任务和视频素材",
  assets: "素材库全部文件",
};

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [conversationQuery, setConversationQuery] = useState("");
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [notice, setNotice] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const refreshConversations = useCallback(async (q = conversationQuery) => {
    const result = await api.conversations(q);
    setConversations(result.conversations);
  }, [conversationQuery]);

  const refreshAssets = useCallback(async () => {
    const result = await api.assets();
    setAssets(result.assets);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    const result = await api.conversation(id);
    setConversation(result.conversation);
    setActiveTab("chat");
  }, []);

  const clearScope = useCallback(async (scope: ClearScope) => {
    const label = CLEAR_LABELS[scope];
    if (!window.confirm(`确认永久清空${label}？这个操作会删除数据库记录和相关文件，不能恢复。`)) return;
    const result = await api.clearScope(scope);
    if (scope === "chat" || scope === "all") {
      setConversation(null);
      await refreshConversations("");
    }
    if (scope === "image" || scope === "video" || scope === "assets" || scope === "all") {
      await refreshAssets();
    }
    setNotice(`已清空${label}：会话 ${result.deleted.conversations}，消息 ${result.deleted.messages}，素材 ${result.deleted.assets}，视频任务 ${result.deleted.videoTasks}。`);
  }, [refreshAssets, refreshConversations]);

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
    const timer = window.setTimeout(() => refreshConversations(conversationQuery).catch(showError(setNotice)), 160);
    return () => window.clearTimeout(timer);
  }, [authenticated, conversationQuery, refreshConversations]);

  if (booting) return <Splash />;
  if (!authenticated) {
    return (
      <LoginPage
        onLogin={async (password) => {
          await api.login(password);
          setAuthenticated(true);
          await Promise.all([refreshConversations(""), refreshAssets()]);
        }}
      />
    );
  }

  const activeConversationId = conversation?.id || null;
  const activeMessages = buildActiveBranch(conversation?.messages || [], conversation?.activeLeafId);
  const leaves = branchLeaves(conversation?.messages || []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav-list" aria-label="主导航">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={activeTab === tab.id ? "nav-item active" : "nav-item"} type="button" onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <section className="conversation-panel">
          <div className="panel-heading">
            <span>会话列表</span>
            <button
              type="button"
              className="icon-button"
              aria-label="新建会话"
              onClick={async () => {
                const created = await api.createConversation();
                await refreshConversations("");
                await openConversation(created.conversation.id);
                setMobileSidebarOpen(false);
              }}
            >
              <Plus size={18} />
            </button>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="搜索会话" />
          </label>
          <div className="conversation-list">
            {conversations.map((item) => (
              <button key={item.id} type="button" className={item.id === activeConversationId ? "conversation-card active" : "conversation-card"} onClick={async () => {
                await openConversation(item.id);
                setMobileSidebarOpen(false);
              }}>
                <strong>{item.title}</strong>
                <span>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</span>
              </button>
            ))}
          </div>
        </section>
        <UserFooter onLogout={async () => {
          await api.logout();
          setAuthenticated(false);
        }} />
      </aside>
      <aside className={mobileSidebarOpen ? "sidebar mobile-drawer open" : "sidebar mobile-drawer"} aria-hidden={!mobileSidebarOpen}>
        <Brand />
        <nav className="nav-list" aria-label="移动端主导航">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={activeTab === tab.id ? "nav-item active" : "nav-item"} type="button" onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <section className="conversation-panel">
          <div className="panel-heading">
            <span>会话列表</span>
            <button
              type="button"
              className="icon-button"
              aria-label="新建会话"
              onClick={async () => {
                const created = await api.createConversation();
                await refreshConversations("");
                await openConversation(created.conversation.id);
                setMobileSidebarOpen(false);
              }}
            >
              <Plus size={18} />
            </button>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="搜索会话" />
          </label>
          <div className="conversation-list">
            {conversations.map((item) => (
              <button key={item.id} type="button" className={item.id === activeConversationId ? "conversation-card active" : "conversation-card"} onClick={async () => {
                await openConversation(item.id);
                setMobileSidebarOpen(false);
              }}>
                <strong>{item.title}</strong>
                <span>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</span>
              </button>
            ))}
          </div>
        </section>
        <UserFooter onLogout={async () => {
          await api.logout();
          setAuthenticated(false);
        }} />
      </aside>
      {mobileSidebarOpen && <button type="button" className="mobile-backdrop" aria-label="关闭会话列表" onClick={() => setMobileSidebarOpen(false)} />}

      <main className="workspace">
        <TopBar activeTab={activeTab} onTabChange={setActiveTab} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        {notice && (
          <div className="notice">
            {notice}
            <button type="button" onClick={() => setNotice("")}>
              <X size={14} />
            </button>
          </div>
        )}
        {activeTab === "chat" && (
          <ChatWorkspace
            conversation={conversation}
            messages={activeMessages}
            leaves={leaves}
            onCreate={async () => {
              const created = await api.createConversation();
              await refreshConversations("");
              await openConversation(created.conversation.id);
            }}
            onRename={async (title) => {
              if (!conversation) return;
              await api.renameConversation(conversation.id, title);
              await refreshConversations("");
              await openConversation(conversation.id);
            }}
            onDelete={async () => {
              if (!conversation || !window.confirm("确认删除这个会话？")) return;
              await api.deleteConversation(conversation.id);
              setConversation(null);
              await refreshConversations("");
            }}
            onBranch={async (leafId) => {
              if (!conversation) return;
              setConversation({ ...conversation, activeLeafId: leafId });
              await api.switchConversationBranch(conversation.id, leafId);
            }}
            onStreamEvent={(event, pendingContent) => {
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
            afterSend={async (conversationId) => {
              await refreshConversations("");
              await openConversation(conversationId);
            }}
            onClearAll={() => clearScope("all")}
          />
        )}
        {activeTab === "image" && <ImageWorkspace assets={assets} onAssetsChanged={refreshAssets} onNotice={setNotice} onClearAll={() => clearScope("image")} />}
        {activeTab === "video" && <VideoWorkspace assets={assets} onAssetsChanged={refreshAssets} onNotice={setNotice} onClearAll={() => clearScope("video")} />}
        {activeTab === "assets" && <AssetWorkspace assets={assets} onAssetsChanged={refreshAssets} onClearAll={() => clearScope("assets")} />}
      </main>

      <nav className="mobile-tabs" aria-label="移动端导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} type="button" onClick={() => setActiveTab(tab.id)}>
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <main className="login-page">
      <section className="login-card">
        <img src="/brand/mascot.png" alt="" className="login-mascot" />
        <h1>{APP_NAME}</h1>
        <p>私人访问</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            try {
              await onLogin(password);
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : "登录失败。");
            } finally {
              setLoading(false);
            }
          }}
        >
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入访问密码" autoFocus />
          <button type="submit" disabled={loading || !password}>
            {loading ? "进入中..." : "进入"}
          </button>
        </form>
        {error && <div className="form-error">{error}</div>}
      </section>
    </main>
  );
}

function Splash() {
  return (
    <div className="splash">
      <img src="/brand/mascot.png" alt="" />
      <span>正在进入{APP_NAME}...</span>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <img src="/brand/mascot.png" alt="" />
      <div>
        <strong>{APP_NAME}</strong>
        <span>私人空间</span>
      </div>
    </div>
  );
}

function UserFooter({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="user-footer">
      <div className="mini-brand">
        <img src="/brand/mascot.png" alt="" />
        <span>{APP_NAME}</span>
      </div>
      <button type="button" className="icon-button" onClick={onLogout} aria-label="退出登录">
        <LogOut size={17} />
      </button>
    </div>
  );
}

function TopBar({ activeTab, onTabChange, onOpenSidebar }: { activeTab: WorkspaceTab; onTabChange: (tab: WorkspaceTab) => void; onOpenSidebar: () => void }) {
  const active = tabs.find((tab) => tab.id === activeTab);
  return (
    <header className="top-bar">
      <button type="button" className="mobile-menu-button" onClick={onOpenSidebar}>
        <MessageCircle size={18} />
        会话
      </button>
      <div>
        <h2>{active?.label || "咨询"}</h2>
        <p>{activeTab === "chat" ? "安静地问，清楚地答。" : activeTab === "image" ? "输入想法，生成一张图。" : activeTab === "video" ? "页面保持打开，等待视频完成。" : "管理你的上传和作品。"}</p>
      </div>
      <div className="top-actions">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "chip active" : "chip"} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function ChatWorkspace({
  conversation,
  messages,
  leaves,
  onCreate,
  onRename,
  onDelete,
  onBranch,
  onStreamEvent,
  afterSend,
  onClearAll,
}: {
  conversation: ConversationDetail | null;
  messages: ChatMessage[];
  leaves: ChatMessage[];
  onCreate: () => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onBranch: (leafId: string) => Promise<void>;
  onStreamEvent: (event: ChatStreamEvent, pendingContent: string) => void;
  afterSend: (conversationId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(initialChatDraft());
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingAssistantRef = useRef<string | null>(null);

  const sendContent = async (content: string, parentId: string | null) => {
    if (!content || streaming) return;
    setStreaming(true);
    setDraft(initialChatDraft());
    const abort = new AbortController();
    abortRef.current = abort;
    let conversationId = conversation?.id;
    let queuedDelta = "";
    let frame: number | null = null;
    const flushQueuedDelta = () => {
      frame = null;
      if (!queuedDelta) return;
      const assistantMessageId = pendingAssistantRef.current;
      if (!assistantMessageId) {
        queuedDelta = "";
        return;
      }
      onStreamEvent({ type: "delta", assistantMessageId, content: queuedDelta }, content);
      queuedDelta = "";
    };
    const flushQueuedDeltaNow = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      flushQueuedDelta();
    };
    try {
      await streamChat(
        { conversationId, parentId, content },
        {
          signal: abort.signal,
          onEvent: (event) => {
            if (event.type === "meta") {
              conversationId = event.conversationId;
              pendingAssistantRef.current = event.assistantMessageId;
              onStreamEvent(event, content);
              return;
            }
            if (event.type === "delta") {
              pendingAssistantRef.current = event.assistantMessageId || pendingAssistantRef.current;
              queuedDelta += event.content;
              if (frame === null) frame = window.requestAnimationFrame(flushQueuedDelta);
              return;
            }
            flushQueuedDeltaNow();
            onStreamEvent({ ...event, assistantMessageId: event.assistantMessageId || pendingAssistantRef.current || "" }, content);
          },
        },
      );
      flushQueuedDeltaNow();
      if (conversationId) await afterSend(conversationId);
    } catch (error) {
      flushQueuedDeltaNow();
      if (abort.signal.aborted && pendingAssistantRef.current) {
        onStreamEvent({ type: "error", assistantMessageId: pendingAssistantRef.current, error: "已停止" }, content);
      } else {
        alert(error instanceof Error ? error.message : "咨询失败。");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      pendingAssistantRef.current = null;
    }
  };

  const send = async () => {
    await sendContent(draft.content.trim(), draft.selectedParentId ?? conversation?.activeLeafId ?? null);
  };

  const regenerate = async (assistantMessage: ChatMessage) => {
    const parentUser = messages.find((message) => message.id === assistantMessage.parentId && message.role === "user");
    if (!parentUser) return;
    await sendContent(parentUser.content, parentUser.parentId || null);
  };

  return (
    <section className="chat-layout">
      <div className="chat-main">
        <div className="chat-title-row">
          <ConversationTitleInput
            key={conversation?.id || "new"}
            title={conversation?.title || "新会话"}
            disabled={!conversation}
            onCommit={async (title) => {
              if (!conversation || title === conversation.title) return;
              await onRename(title);
            }}
          />
          <div className="row-actions">
            <button type="button" className="ghost-button" onClick={onCreate}>
              <Plus size={16} /> 新建
            </button>
            <button type="button" className="ghost-button danger" onClick={onDelete} disabled={!conversation}>
              <Trash2 size={16} /> 删除
            </button>
            <ClearAllButton label="清空全部" onClear={onClearAll} />
          </div>
        </div>

        <div className="messages">
          {messages.length === 0 ? (
            <EmptyState title="可以开始问了" text="这里只保留你的私人会话，不显示内部服务信息。" />
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="avatar">{message.role === "assistant" ? <img src="/brand/mascot.png" alt="" /> : <Bot size={18} />}</div>
                <div className="message-body">
                  <div className="message-meta">
                    <span>{message.role === "assistant" ? ASSISTANT_NAME : "你"}</span>
                    {message.status === "streaming" && <em>正在生成...</em>}
                    {message.status === "interrupted" && <em>已中断</em>}
                  </div>
                  <Markdown content={message.content || "正在思考..."} />
                  <div className="message-actions">
                    <button type="button" onClick={() => navigator.clipboard.writeText(message.content)}>
                      <Copy size={14} /> 复制
                    </button>
                    {message.role === "user" && (
                      <button type="button" onClick={() => setDraft({ content: message.content, selectedParentId: message.parentId || null })}>
                        <Edit3 size={14} /> 编辑后发送
                      </button>
                    )}
                    {message.role === "assistant" && (
                      <button type="button" onClick={() => regenerate(message)} disabled={streaming}>
                        <RefreshCw size={14} /> 重新生成
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="composer">
          {draft.selectedParentId !== null && <div className="draft-note">正在从旧问题处分支。发送后会保留原分支。</div>}
          <textarea
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="输入你的问题...（Shift + Enter 换行）"
          />
          <div className="composer-actions">
            <button type="button" className="ghost-button" onClick={() => setDraft(initialChatDraft())}>
              清空
            </button>
            {streaming ? (
              <button type="button" className="primary-button muted" onClick={() => abortRef.current?.abort()}>
                <Square size={16} /> 停止回答
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={send} disabled={!draft.content.trim()}>
                <Send size={16} /> 发送
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="right-panel">
        <h3>会话信息</h3>
        <InfoLine label="消息数" value={String(conversation?.messages.length || 0)} />
        <InfoLine label="分支数" value={String(leaves.length || 0)} />
        <div className="branch-list">
          <span>可切换分支</span>
          {leaves.length === 0 ? <p>暂无分支</p> : leaves.map((leaf) => (
            <button key={leaf.id} type="button" onClick={() => onBranch(leaf.id)} className={leaf.id === conversation?.activeLeafId ? "active" : ""}>
              {leaf.content.slice(0, 24) || "空回答"}
            </button>
          ))}
        </div>
        <img src="/brand/mascot.png" alt="" className="panel-mascot" />
      </aside>
    </section>
  );
}

function ConversationTitleInput({ title, disabled, onCommit }: { title: string; disabled: boolean; onCommit: (title: string) => Promise<void> }) {
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const commit = async () => {
    const nextTitle = draft.trim();
    if (!nextTitle) {
      setDraft(title);
      return;
    }
    await onCommit(nextTitle);
  };
  return (
    <input
      ref={inputRef}
      className="title-input"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          inputRef.current?.blur();
        }
      }}
      disabled={disabled}
    />
  );
}

function ImageWorkspace({ assets, onAssetsChanged, onNotice, onClearAll }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void> }) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(() => readStoredImageSize());
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const imageAssets = filterAssets(assets, "image");

  const generate = async () => {
    setLoading(true);
    try {
      localStorage.setItem(IMAGE_SIZE_STORAGE_KEY, size);
      const result = await api.generateImage({ prompt, size, referenceAssetIds: referenceIds });
      onNotice(`图片已保存到素材库：${result.asset.filename}`);
      setPrompt("");
      await onAssetsChanged();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "图片生成失败。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-grid">
      <div className="tool-card">
        <div className="tool-card-heading">
          <h3>生成一张图片</h3>
          <ClearAllButton label="清空图片" onClear={async () => {
            await onClearAll();
            setReferenceIds([]);
          }} />
        </div>
        <p>每次生成 1 张。选择参考图时会走图生图或多图合成。</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="描述你想要的画面..." />
        <Segmented<ImageSize>
          value={size}
          options={[
            ["1024x1024", "正方形"],
            ["1024x768", "横版"],
            ["768x1024", "竖版"],
          ]}
          onChange={setSize}
        />
        <ReferencePicker assets={imageAssets} selected={referenceIds} onChange={setReferenceIds} />
        <UploadBox onUploaded={onAssetsChanged} onNotice={onNotice} />
        <button type="button" className="primary-button full" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <RefreshCw size={16} className="spin" /> : <ImageIcon size={16} />} {loading ? "生成中..." : "生成图片"}
        </button>
      </div>
      <PreviewRail assets={filterAssets(assets, "image")} title="最近图片" />
    </section>
  );
}

function VideoWorkspace({ assets, onAssetsChanged, onNotice, onClearAll }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void> }) {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<VideoPreset>("standard");
  const [fps, setFps] = useState(24);
  const [ratio, setRatio] = useState("1152x768");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [keyframes, setKeyframes] = useState(false);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [task, setTask] = useState<{ id: string; status: string; progress: number; assetUrl?: string } | null>(null);
  const imageAssets = filterAssets(assets, "image");
  const presetInfo = videoPresetToRequest(preset);

  useEffect(() => {
    if (!task || task.status === "completed" || task.status === "failed") return;
    const timer = window.setInterval(async () => {
      try {
        const result = await api.videoTask(task.id);
        setTask(result.task);
        if (result.task.status === "completed") {
          await onAssetsChanged();
          onNotice("视频已完成并保存到素材库。");
        }
      } catch (error) {
        onNotice(error instanceof Error ? error.message : "视频查询失败。");
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [task, onAssetsChanged, onNotice]);

  const [width, height] = ratio.split("x").map(Number);

  return (
    <section className="tool-grid">
      <div className="tool-card">
        <div className="tool-card-heading">
          <h3>生成一个视频</h3>
          <ClearAllButton
            label="清空视频"
            onClear={async () => {
              await onClearAll();
              setTask(null);
              setReferenceIds([]);
            }}
          />
        </div>
        <p>视频生成期间请保持页面打开。关闭页面后任务会被视为放弃。</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="描述画面、动作、镜头和氛围..." />
        <Segmented<VideoPreset>
          value={preset}
          options={[
            ["short", "约 5 秒"],
            ["standard", "约 10 秒"],
            ["max", "拉满"],
          ]}
          onChange={setPreset}
        />
        <div className="field-row">
          <label>
            画幅
            <select value={ratio} onChange={(event) => setRatio(event.target.value)}>
              <option value="1152x768">横版高清</option>
              <option value="768x1152">竖版高清</option>
            </select>
          </label>
          <label>
            FPS
            <input type="number" min={1} max={60} value={fps} onChange={(event) => setFps(Number(event.target.value))} />
          </label>
        </div>
        <details className="advanced">
          <summary>高级选项</summary>
          <input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="负面提示词，可选" />
          <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="种子，可选" />
          <label className="checkbox-line">
            <input type="checkbox" checked={keyframes} onChange={(event) => setKeyframes(event.target.checked)} />
            使用关键帧模式
          </label>
        </details>
        <ReferencePicker assets={imageAssets} selected={referenceIds} onChange={setReferenceIds} />
        {task ? (
          <div className="task-card">
            <strong>当前任务：{task.status}</strong>
            <div className="progress"><span style={{ width: `${task.progress}%` }} /></div>
            <p>{task.progress}% · {presetInfo.numFrames} 帧</p>
            {task.assetUrl && <a href={task.assetUrl} target="_blank" rel="noreferrer">打开视频</a>}
            {task.status !== "completed" && (
              <button type="button" className="ghost-button danger" onClick={async () => {
                await api.abandonVideo(task.id);
                setTask(null);
              }}>
                放弃任务
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary-button full"
            disabled={!prompt.trim()}
            onClick={async () => {
              try {
                const result = await api.createVideo({
                  prompt,
                  preset,
                  fps,
                  width,
                  height,
                  referenceAssetIds: referenceIds,
                  keyframes,
                  negativePrompt: negativePrompt || undefined,
                  seed: seed ? Number(seed) : undefined,
                });
                setTask(result.task);
              } catch (error) {
                onNotice(error instanceof Error ? error.message : "视频任务创建失败。");
              }
            }}
          >
            <Film size={16} /> 创建视频任务
          </button>
        )}
      </div>
      <PreviewRail assets={filterAssets(assets, "video")} title="最近视频" />
    </section>
  );
}

function AssetWorkspace({ assets, onAssetsChanged, onClearAll }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onClearAll: () => Promise<void> }) {
  const [filter, setFilter] = useState<AssetFilter>("all");
  const visible = filterAssets(assets, filter);
  return (
    <section className="asset-page">
      <div className="asset-toolbar">
        <h3>素材库</h3>
        <div className="toolbar-actions">
          <Segmented<AssetFilter>
            value={filter}
            options={[
              ["all", "全部"],
              ["upload", "上传"],
              ["image", "图片"],
              ["video", "视频"],
            ]}
            onChange={setFilter}
          />
          <ClearAllButton label="清空素材库" onClear={async () => {
            await onClearAll();
            await onAssetsChanged();
          }} />
        </div>
      </div>
      <div className="asset-grid">
        {visible.length === 0 ? (
          <EmptyState title="还没有素材" text="上传参考图或生成作品后，会出现在这里。" />
        ) : (
          visible.map((asset) => (
            <article className="asset-card" key={asset.id}>
              <div className="asset-preview">{asset.mediaType.startsWith("video") ? <video src={asset.url} controls /> : <img src={asset.url} alt={asset.filename} />}</div>
              <div className="asset-meta">
                <strong>{asset.filename}</strong>
                <span>{asset.kind} · {formatBytes(asset.size)}</span>
              </div>
              <div className="asset-actions">
                <a href={`${asset.url}?download=1`}>下载</a>
                <button type="button" className="danger" onClick={async () => {
                  if (!window.confirm("确认永久删除这个素材？")) return;
                  await api.deleteAsset(asset.id);
                  await onAssetsChanged();
                }}>
                  删除
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ReferencePicker({ assets, selected, onChange }: { assets: AssetItem[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <div className="reference-picker">
      <span>参考图（最多 4 张）</span>
      <div className="reference-grid">
        {assets.slice(0, 12).map((asset) => {
          const checked = selected.includes(asset.id);
          return (
            <button
              type="button"
              key={asset.id}
              className={checked ? "selected" : ""}
              onClick={() => {
                if (checked) onChange(selected.filter((id) => id !== asset.id));
                else if (selected.length < 4) onChange([...selected, asset.id]);
              }}
            >
              <img src={asset.url} alt={asset.filename} />
              {checked && <Check size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadBox({ onUploaded, onNotice }: { onUploaded: () => Promise<void>; onNotice: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      await api.upload(Array.from(files).slice(0, 4));
      await onUploaded();
      onNotice("参考素材已上传。");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "上传失败。");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <button type="button" className="upload-box" onClick={() => inputRef.current?.click()}>
      <Upload size={18} />
      上传参考图
      <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => upload(event.target.files)} />
    </button>
  );
}

function PreviewRail({ assets, title }: { assets: AssetItem[]; title: string }) {
  return (
    <aside className="preview-rail">
      <h3>{title}</h3>
      {assets.length === 0 ? <EmptyState title="暂无作品" text="生成后会自动保存。" /> : assets.slice(0, 6).map((asset) => (
        <a href={asset.url} target="_blank" rel="noreferrer" className="preview-card" key={asset.id}>
          {asset.mediaType.startsWith("video") ? <video src={asset.url} muted /> : <img src={asset.url} alt={asset.filename} />}
          <span>{asset.filename}</span>
        </a>
      ))}
    </aside>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const text = String(children).replace(/\n$/, "");
            if (className?.includes("language-mermaid")) return <MermaidBlock source={text} />;
            if (className?.startsWith("language-") || String(children).includes("\n")) return <CodeSnippet className={className} code={text} />;
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeSnippet({ className, code }: { className?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="code-snippet">
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? "已复制" : "复制代码"}
      </button>
      <code className={className}>{code}</code>
    </span>
  );
}

function MermaidBlock({ source }: { source: string }) {
  const [svg, setSvg] = useState("");
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    let cancelled = false;
    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: "base" });
        return mermaid.render(id, source);
      })
      .then((result) => {
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [id, source]);
  if (!svg) return <pre className="mermaid-fallback">{source}</pre>;
  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return (
    <div className="segmented">
      {options.map(([option, label]) => (
        <button type="button" key={option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ClearAllButton({ label, onClear }: { label: string; onClear: () => Promise<void> }) {
  const [clearing, setClearing] = useState(false);
  return (
    <button
      type="button"
      className="ghost-button danger clear-all-button"
      disabled={clearing}
      onClick={async () => {
        setClearing(true);
        try {
          await onClear();
        } finally {
          setClearing(false);
        }
      }}
    >
      <Trash2 size={16} /> {clearing ? "清空中..." : label}
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <img src="/brand/mascot.png" alt="" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function branchLeaves(messages: ChatMessage[]) {
  const parents = new Set(messages.map((message) => message.parentId).filter(Boolean));
  return messages.filter((message) => message.role === "assistant" && !parents.has(message.id));
}

function readStoredImageSize() {
  const stored = localStorage.getItem(IMAGE_SIZE_STORAGE_KEY);
  return IMAGE_SIZES.includes(stored as ImageSize) ? (stored as ImageSize) : "1024x1024";
}

function showError(setNotice: (message: string) => void) {
  return (error: unknown) => setNotice(error instanceof Error ? error.message : "请求失败。");
}

export default App;
