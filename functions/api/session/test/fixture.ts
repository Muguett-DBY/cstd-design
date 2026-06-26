import { createConversation, insertMessage } from "../../../_shared/db";
import { buildE2EExportFixture } from "../../../_shared/e2e-fixtures";
import { authorizeE2ESessionRequest, ensureSchema, json, readJson, type PagesContext } from "../../../_shared/http";

type FixtureRequestBody = {
  label?: unknown;
};

export async function onRequestPost({ request, env }: PagesContext) {
  const blocked = authorizeE2ESessionRequest(request, env);
  if (blocked) return blocked;

  await ensureSchema(env.DB);
  const body = await readJson<FixtureRequestBody>(request);
  const label = typeof body?.label === "string" ? body.label : new Date().toISOString();
  const fixture = buildE2EExportFixture(label);
  const conversation = await createConversation(env, fixture.title);
  let parentId: string | null = null;
  const inserted = [];

  for (const message of fixture.messages) {
    const row = await insertMessage(env, {
      conversationId: conversation.id,
      parentId,
      role: message.role,
      content: message.content,
      status: "complete",
    });
    inserted.push(row);
    parentId = row.id;
  }

  return json({
    conversation: {
      ...conversation,
      title: fixture.title,
      activeLeafId: inserted.at(-1)?.id ?? null,
      messageCount: inserted.length,
    },
  }, 201);
}
