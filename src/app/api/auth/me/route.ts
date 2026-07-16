import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser, safeUser, listSessions, currentToken } from "@/lib/auth";
import { getRole } from "@/lib/rbac-store";

export const GET = withHandler(async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ data: null });
  const [role, sessions, token] = await Promise.all([getRole(user.roleSlug), listSessions(user.id), currentToken()]);
  return NextResponse.json({
    data: safeUser(user),
    role: role ? { slug: role.slug, name: role.name, permissions: role.permissions } : null,
    sessions: sessions.map((s) => ({ id: s.id, userAgent: s.userAgent, ip: s.ip, lastSeenAt: s.lastSeenAt, current: s.token === token })),
  });
});
