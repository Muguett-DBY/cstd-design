# Iteration Log

## Round 17 (latest)

**Flagship**: Conversation sort/filter

### Completed
- Added `sortConversations` utility with 3 modes: `updatedAt`, `createdAt`, `title` (Chinese locale sorting)
- Sort bar UI below search box with chevron indicators (active state highlighted)
- Conversation count badge in panel heading (accent-colored pill)
- CSS for `.sort-bar`, `.sort-option`, `.conversation-count`
- Sort mode persisted locally in sidebar state

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Message search within conversation** — Search through chat history
3. **Drag-and-drop reorder** — Allow users to manually pin or reorder conversations

## Round 16 (1128213)

**Flagship**: Image generation prompt templates

### Completed
- Created `usePromptTemplates` hook with localStorage persistence (CRUD for templates)
- Template picker UI in ImageWorkspace (save/load/delete)
- Save button appears when prompt is non-empty
- Load button toggles template list
- Delete with inline button per template
- Template list with scrollable container
- Empty state message for no templates

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Conversation sort/filter** — Allow users to sort conversations by date/title
3. **Message search within conversation** — Search through chat history
