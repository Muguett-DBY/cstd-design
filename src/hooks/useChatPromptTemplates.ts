import { useCallback, useEffect, useState } from "react";
import { expandVariables } from "./usePromptTemplates";

const STORAGE_KEY = "cstd-design:chat-prompt-templates";

export interface ChatPromptTemplate {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  variables?: string[];
}

function loadTemplates(): ChatPromptTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedTemplates();
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seedTemplates();
  } catch {
    return seedTemplates();
  }
}

function seedTemplates(): ChatPromptTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: "seed-1",
      name: "总结今日内容",
      prompt: "请用简洁的要点总结今天 ({{date}}) 讨论的内容，列出 3 个关键信息：\n\n",
      createdAt: now,
      variables: ["date"],
    },
    {
      id: "seed-2",
      name: "翻译为中文",
      prompt: "请将以下内容翻译成流畅的中文，保留专业术语：\n\n",
      createdAt: now,
    },
    {
      id: "seed-3",
      name: "头脑风暴",
      prompt: "现在是 {{datetime}}。围绕以下主题，请给出 10 个新颖且有创意的想法：\n\n主题：",
      createdAt: now,
      variables: ["datetime"],
    },
  ];
}

export function useChatPromptTemplates() {
  const [templates, setTemplates] = useState<ChatPromptTemplate[]>(loadTemplates);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch {
      // localStorage may be full or disabled
    }
  }, [templates]);

  const save = useCallback((name: string, prompt: string) => {
    setTemplates((prev) => {
      const newTemplate: ChatPromptTemplate = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        prompt,
        createdAt: new Date().toISOString(),
      };
      return [newTemplate, ...prev];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { templates, save, remove };
}

export { expandVariables };
