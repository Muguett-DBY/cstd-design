export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

export function selectMessagesForContext(messages: ModelMessage[], maxCharacters: number) {
  const selected: ModelMessage[] = [];
  let used = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const cost = message.content.length + message.role.length + 8;
    if (selected.length > 0 && used + cost > maxCharacters) break;
    if (selected.length === 0 || used + cost <= maxCharacters) {
      selected.unshift(message);
      used += cost;
    }
  }

  return { messages: selected, truncated: selected.length < messages.length };
}
