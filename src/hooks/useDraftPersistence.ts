import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "cstd-design:draft:";
const DEBOUNCE_MS = 500;

type Draft = {
  content: string;
  selectedParentId: string | null;
};

function loadDraft(conversationId: string): Draft {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${conversationId}`);
    if (!raw) return { content: "", selectedParentId: null };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { content: "", selectedParentId: null };
    return {
      content: typeof parsed.content === "string" ? parsed.content : "",
      selectedParentId: typeof parsed.selectedParentId === "string" ? parsed.selectedParentId : null,
    };
  } catch {
    return { content: "", selectedParentId: null };
  }
}

function saveDraft(conversationId: string, draft: Draft) {
  try {
    if (!draft.content.trim()) {
      localStorage.removeItem(`${STORAGE_PREFIX}${conversationId}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${conversationId}`, JSON.stringify(draft));
    }
  } catch {
    // ignore
  }
}

export function useDraftPersistence(conversationId: string | null, initialDraft?: Draft) {
  const [draft, setDraftState] = useState<Draft>(() =>
    initialDraft && initialDraft.content.trim() ? initialDraft :
    conversationId ? loadDraft(conversationId) : { content: "", selectedParentId: null }
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (conversationId) {
      debounceRef.current = window.setTimeout(() => {
        saveDraft(conversationId, draft);
      }, DEBOUNCE_MS);
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [draft, conversationId]);

  const setDraft = useCallback((updater: Draft | ((prev: Draft) => Draft)) => {
    setDraftState((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState({ content: "", selectedParentId: null });
  }, []);

  return { draft, setDraft, clearDraft };
}
