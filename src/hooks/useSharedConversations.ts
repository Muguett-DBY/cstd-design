export interface SharedConversation {
  token: string;
  title: string;
  messages: { role: string; content: string; createdAt?: string }[];
  createdAt: string;
}

const STORAGE_KEY = "cstd-design:shared-conversations";

function loadShared(): Record<string, SharedConversation> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function persist(shared: Record<string, SharedConversation>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shared));
  } catch {
    // ignore
  }
}

function generateToken(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createShareLink(title: string, messages: { role: string; content: string; createdAt?: string }[]): SharedConversation {
  const token = generateToken();
  const shared: SharedConversation = {
    token,
    title,
    messages: messages.filter((m) => m.content && m.content.trim()).map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    createdAt: new Date().toISOString(),
  };
  const all = loadShared();
  all[token] = shared;
  persist(all);
  return shared;
}

export function getSharedConversation(token: string): SharedConversation | null {
  const all = loadShared();
  return all[token] || null;
}

export function deleteShared(token: string) {
  const all = loadShared();
  delete all[token];
  persist(all);
}

export function listShared(): SharedConversation[] {
  return Object.values(loadShared()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
