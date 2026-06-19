import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:image-prompt-templates";

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  variables?: string[];
}

export interface PromptTemplateVariable {
  name: string;
  description: string;
}

export const AVAILABLE_VARIABLES: PromptTemplateVariable[] = [
  { name: "date", description: "今天的日期 (YYYY-MM-DD)" },
  { name: "time", description: "当前时间 (HH:MM)" },
  { name: "datetime", description: "完整日期时间" },
  { name: "year", description: "当前年份" },
  { name: "month", description: "当前月份" },
  { name: "day", description: "今天的日子" },
];

function expandVariables(text: string, custom: Record<string, string> = {}): string {
  const now = new Date();
  const vars: Record<string, () => string> = {
    date: () => now.toISOString().slice(0, 10),
    time: () => now.toTimeString().slice(0, 5),
    datetime: () => now.toLocaleString("zh-CN"),
    year: () => String(now.getFullYear()),
    month: () => String(now.getMonth() + 1).padStart(2, "0"),
    day: () => String(now.getDate()).padStart(2, "0"),
    ...Object.fromEntries(Object.entries(custom).map(([k, v]) => [k, () => v])),
  };
  return text.replace(/\{\{(\s*)(\w+)(\s*)\}\}/g, (match, _a, key: string) => {
    const resolver = vars[key];
    return resolver ? resolver() : match;
  });
}

export { expandVariables };

export function usePromptTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const save = useCallback((name: string, prompt: string, variables?: string[]) => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      prompt,
      variables,
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => {
      const next = [newTemplate, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { templates, save, remove };
}
