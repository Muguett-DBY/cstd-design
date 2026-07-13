import type { Env } from "./http";
import {
  assertD1BatchSucceeded,
  drainAssetDeletionQueue,
  prepareAssetKindDeletionQueue,
} from "./asset-deletion";

export type ClearScope = "chat" | "image" | "video" | "assets" | "all";
export type AssetKind = "upload" | "image" | "video";

const SCOPES = new Set<ClearScope>(["chat", "image", "video", "assets", "all"]);

export function normalizeClearScope(value: string | null): ClearScope | null {
  return value && SCOPES.has(value as ClearScope) ? (value as ClearScope) : null;
}

export function assetKindsForClearScope(scope: ClearScope): AssetKind[] {
  if (scope === "image") return ["image"];
  if (scope === "video") return ["video"];
  if (scope === "assets" || scope === "all") return ["upload", "image", "video"];
  return [];
}

export function chatTablesForClearScope(scope: ClearScope): string[] {
  if (scope !== "chat" && scope !== "all") return [];
  return ["message_edits", "reactions", "pins", "bookmarks", "message_threads", "messages", "conversations"];
}

export async function clearWorkspaceScope(env: Env, scope: ClearScope) {
  const result = {
    conversations: 0,
    messages: 0,
    assets: 0,
    videoTasks: 0,
    r2Objects: 0,
    r2Deferred: 0,
  };

  const statements: D1PreparedStatement[] = [];

  if (scope === "chat" || scope === "all") {
    result.messages = await countRows(env, "messages");
    result.conversations = await countRows(env, "conversations");
    statements.push(...chatTablesForClearScope(scope).map((table) => env.DB.prepare(`DELETE FROM ${table}`)));
  }

  if (scope === "video" || scope === "assets" || scope === "all") {
    result.videoTasks = await countRows(env, "video_tasks");
    statements.push(env.DB.prepare(`DELETE FROM video_tasks`));
  }

  const kinds = assetKindsForClearScope(scope);
  const assets = await listAssetsByKind(env, kinds);
  result.assets = assets.length;

  if (kinds.length) {
    const placeholders = kinds.map((_, index) => `?${index + 1}`).join(", ");
    statements.push(
      prepareAssetKindDeletionQueue(env.DB, kinds),
      env.DB.prepare(`DELETE FROM assets WHERE kind IN (${placeholders})`).bind(...kinds),
    );
  }

  const batchResults = await env.DB.batch(statements);
  assertD1BatchSucceeded(batchResults, statements.length);

  if (kinds.length) {
    const cleanup = await drainAssetDeletionQueue(env, assets.map((asset) => asset.object_key));
    result.r2Objects = cleanup.r2Objects;
    result.r2Deferred = cleanup.r2Deferred;
  }
  return result;
}

async function countRows(env: Env, table: "conversations" | "messages" | "assets" | "video_tasks") {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
  return Number(row?.count || 0);
}

async function listAssetsByKind(env: Env, kinds: AssetKind[]) {
  if (!kinds.length) return [];
  const placeholders = kinds.map((_, index) => `?${index + 1}`).join(", ");
  const result = await env.DB.prepare(`SELECT id, object_key FROM assets WHERE kind IN (${placeholders})`)
    .bind(...kinds)
    .all<{ id: string; object_key: string }>();
  return result.results || [];
}
