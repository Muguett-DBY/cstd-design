# Durable Thread Center Design

## Goal

Turn message threads from browser-local notes into a durable, product-level workflow that follows the authenticated workspace and is easy to review and manage.

## Product behavior

- Thread replies are stored in D1 and attached to a real conversation and parent message.
- Each reply has a stable ID plus created and updated timestamps.
- Users can add, edit, delete, and clear replies with visible loading and error feedback.
- The existing inline thread view remains available beside its parent message.
- The right panel gains a Thread Center listing every active thread in the current conversation. Selecting an item expands and scrolls to its parent message.
- Empty, loading, and failure states are explicit. Failed writes do not silently mutate the UI.

## Architecture

- Add a `message_threads` D1 table and indexes through an additive migration and `ensureSchema`.
- Add authenticated REST handlers:
  - `GET/POST /api/conversations/:conversationId/threads`
  - `PATCH/DELETE /api/threads/:threadId`
  - `DELETE /api/conversations/:conversationId/threads?parentMessageId=:messageId` for clearing one thread.
- Validate all payloads with Zod and verify that parent messages belong to the requested conversation.
- Replace the localStorage hook with an API-backed hook scoped by conversation ID.
- Extract inline thread rendering and Thread Center rendering from `ChatWorkspace` into focused components.

## Data model

`message_threads` contains:

- `id` UUID primary key
- `conversation_id` UUID
- `parent_message_id` UUID
- `content` text
- `created_at` ISO timestamp
- `updated_at` ISO timestamp

Deleting or clearing chat content explicitly removes thread rows before messages and conversations. Soft-deleted conversations are excluded from thread access.

## Error handling and concurrency

- API handlers return 404 when the conversation, parent message, or reply is unavailable.
- Content is trimmed and limited to 4,000 characters.
- The client ignores stale fetch responses when users switch conversations quickly.
- Mutations update state only after the server confirms success.
- Controls are disabled while their operation is pending.

## Verification

- Unit tests cover thread payload validation and thread grouping/summaries.
- Existing frontend and Functions tests remain green.
- Run CI-equivalent test, Functions typecheck, lint, and production build.
- Browser QA checks desktop and mobile thread creation, expansion, Thread Center jump, edit, delete, and empty/error states.
