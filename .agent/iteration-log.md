# Iteration Log

## Round 14 (5e84cfc)

**Flagship**: Conversation export as Markdown

### Completed
- Added export button to ChatWorkspace header actions
- Client-side Markdown generation with role labels and timestamps
- File download via Blob + URL.createObjectURL
- Sanitized filename for safe cross-platform downloads
- Toast notification on successful export

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Retry mechanism for failed API calls** — Automatic retry with exponential backoff
3. **Image generation prompt templates** — Save/load frequently used prompts
