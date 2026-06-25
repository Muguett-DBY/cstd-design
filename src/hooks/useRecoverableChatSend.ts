import { useCallback, useState } from "react";

export type ChatSubmission = {
  content: string;
  parentId: string | null;
};

export type RecoverableChatSend = ChatSubmission & {
  error: string;
};

export function useRecoverableChatSend() {
  const [pending, setPending] = useState<ChatSubmission | null>(null);
  const [failed, setFailed] = useState<RecoverableChatSend | null>(null);

  const begin = useCallback((content: string, parentId: string | null) => {
    setPending({ content, parentId });
    setFailed(null);
  }, []);

  const succeed = useCallback(() => {
    setPending(null);
    setFailed(null);
  }, []);

  const fail = useCallback((error: string) => {
    setPending((current) => {
      if (current) setFailed({ ...current, error });
      return null;
    });
  }, []);

  const dismiss = useCallback(() => setFailed(null), []);
  const restore = useCallback((currentContent: string) => {
    if (currentContent.trim()) return null;
    return failed;
  }, [failed]);

  return { pending, failed, begin, succeed, fail, dismiss, restore };
}
