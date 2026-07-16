import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/rbac-store";

// Account self-deletion (GDPR) — removes the user and all their sessions.
export const POST = withHandler(async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.appUser.delete({ where: { id: user.id } });
  await audit(user.email, "auth.account_deleted");
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
