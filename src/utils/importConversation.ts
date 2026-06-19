export interface ImportedMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface ImportedConversation {
  title: string;
  messages: ImportedMessage[];
}

export function parseImportedConversation(text: string): ImportedConversation {
  const trimmed = text.trim();
  if (!trimmed) {
    return { title: "导入的对话", messages: [] };
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJson(trimmed);
  }
  return parseMarkdown(trimmed);
}

function parseJson(text: string): ImportedConversation {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return {
        title: "导入的对话",
        messages: data.filter((m: unknown) => isMessageLike(m)),
      };
    }
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const title = typeof obj.title === "string" ? obj.title : "导入的对话";
      const messages = Array.isArray(obj.messages) ? obj.messages.filter((m: unknown) => isMessageLike(m)) : [];
      return { title, messages };
    }
  } catch {
    // fall through
  }
  return { title: "导入的对话", messages: [] };
}

function isMessageLike(m: unknown): m is ImportedMessage {
  if (!m || typeof m !== "object") return false;
  const obj = m as Record<string, unknown>;
  return typeof obj.role === "string" && typeof obj.content === "string";
}

function parseMarkdown(text: string): ImportedConversation {
  const lines = text.split(/\r?\n/);
  let title = "导入的对话";
  const messages: ImportedMessage[] = [];
  let currentRole: "user" | "assistant" | "system" | null = null;
  let currentContent: string[] = [];
  const flush = () => {
    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join("\n").trim(),
      });
    }
    currentRole = null;
    currentContent = [];
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flush();
      title = line.slice(2).trim() || "导入的对话";
      continue;
    }
    const trimmed = line.trim();
    const userMatch = /^(\*\*)?你[:：](\*\*)?\s*$/.test(trimmed) || /^(\*\*)?用户[:：](\*\*)?\s*$/.test(trimmed) || /^(\*\*)?Human[:：](\*\*)?\s*$/i.test(trimmed);
    const assistantMatch = /^(\*\*)?助手[:：](\*\*)?\s*$/.test(trimmed) || /^(\*\*)?Assistant[:：](\*\*)?\s*$/i.test(trimmed);
    if (userMatch) {
      flush();
      currentRole = "user";
    } else if (assistantMatch) {
      flush();
      currentRole = "assistant";
    } else if (currentRole) {
      currentContent.push(line);
    }
  }
  flush();
  return { title, messages };
}
