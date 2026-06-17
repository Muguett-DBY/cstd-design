# Iteration Log

## Round 20 (latest)

**Flagship**: Build size optimization - lazy load Mermaid chunk

### Completed
- Extracted `MermaidBlock` component into separate file for better code splitting
- Updated `Markdown` component to use `React.lazy` for MermaidBlock
- Added `Suspense` wrapper with fallback for lazy-loaded MermaidBlock
- MermaidBlock component now only loads when mermaid code blocks are encountered
- Added "Copy All" button to ChatWorkspace for quick conversation sharing
- Added `copyAllAsText` function that copies conversation as plain text

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message reactions** — Add emoji reactions to messages for quick feedback
2. **Conversation search improvements** — Add date range filter and message count filter
3. **Keyboard shortcuts** — Add more keyboard shortcuts for common actions

## Round 19 (01ebe36)

**Flagship**: Drag-and-drop reorder for conversations

### Completed
- Created `useConversationOrder` hook with drag-and-drop logic and localStorage persistence
- Updated `Sidebar` component with drag-and-drop support:
  - Added `GripVertical` icon as drag handle
  - Added `draggable` attribute to conversation cards
  - Added `onDragStart`, `onDragOver`, `onDragLeave`, `onDrop` handlers
  - Added visual feedback (drag-over state with dashed outline and background color)
- Added CSS for drag handle, drag-over state, and cursor states
- Added bulk download for assets:
  - Added `downloadSelected` function in `AssetWorkspace`
  - Added download button in batch actions UI
  - Downloads all selected assets as individual files

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Message reactions** — Add emoji reactions to messages for quick feedback
3. **Conversation search improvements** — Add date range filter and message count filter

## Round 18 (7a8df3b)

**Flagship**: Message search within conversation

### Completed
- Created `useMessageSearch` hook with search logic, result navigation, and active index tracking
- Created `MessageSearchBar` component with search input, result count, and navigation buttons
- Updated `Markdown` component to support `highlightQuery` prop for search result highlighting
- Integrated search into `ChatWorkspace` with:
  - Search button in toolbar
  - Ctrl+F keyboard shortcut to open search
  - Auto-scroll to active search result
  - Result count display (e.g., "3/15")
  - Enter/Shift+Enter to navigate results
  - Escape to close search
- Added CSS for search bar, result count, navigation buttons, and search highlighting
- Added visual pulse animation for active search result

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Drag-and-drop reorder** — Allow users to manually pin or reorder conversations
3. **Message reactions** — Add emoji reactions to messages for quick feedback

## Round 17 (508d3d9)

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
