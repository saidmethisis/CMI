import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser, currentToken, destroyOtherSessions } from "@/lib/auth";
import { audit } from "@/lib/rbac-store";

// Terminate all other active sessions (keep the current device).
export const DELETE = withHandler(async () => {
  const user = await currentUser();
  const token = await currentToken();
  if (!user || !token) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  await destroyOtherSessions(user.id, token);
  await audit(user.email, "auth.sessions_revoked");
  return NextResponse.json({ data: { ok: true } });
});
