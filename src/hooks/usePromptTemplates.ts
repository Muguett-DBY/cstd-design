import { useState, useCallback } from "react";

const STORAGE_KEY = "cstd-design:image-prompt-templates";

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
}

export function usePromptTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const save = useCallback((name: string, prompt: string) => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      prompt,
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
