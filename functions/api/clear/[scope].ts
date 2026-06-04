import { clearWorkspaceScope, normalizeClearScope } from "../../_shared/clear";
import { badRequest, enforceRateLimit, json, requireSession, type PagesContext } from "../../_shared/http";

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const scope = normalizeClearScope(String(params.scope || ""));
  if (!scope) return badRequest("清空范围无效。");
  const limited = await enforceRateLimit(env, auth.session.sessionId, `clear:${scope}`, 12, 60 * 60_000);
  if (limited) return limited;
  const deleted = await clearWorkspaceScope(env, scope);
  return json({ ok: true, deleted });
}
