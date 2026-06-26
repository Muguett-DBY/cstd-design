import { authorizeE2ESessionRequest, createAuthenticatedSession, type PagesContext } from "../../_shared/http";

export async function onRequestPost({ request, env }: PagesContext) {
  const blocked = authorizeE2ESessionRequest(request, env);
  if (blocked) return blocked;
  return createAuthenticatedSession(request, env);
}
