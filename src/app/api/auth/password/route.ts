import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, verifyPassword, hashPassword, currentToken, destroyOtherSessions } from "@/lib/auth";
import { audit } from "@/lib/rbac-store";

export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const { current, next } = await readBody(req);
  if (user.passwordHash && !verifyPassword(current ?? "", user.passwordHash)) {
    return NextResponse.json({ error: { message: "Текущий пароль неверен." } }, { status: 400 });
  }
  if (!next || String(next).length < 8) {
    return NextResponse.json({ error: { message: "Новый пароль минимум 8 символов." } }, { status: 422 });
  }
  await prisma.appUser.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  // Завершаем все ОСТАЛЬНЫЕ сессии. Смену пароля обычно делают именно потому,
  // что доступ мог утечь, — а раньше чужая сессия продолжала работать как ни в
  // чём не бывало ещё 30 дней. Сброс пароля (/api/auth/reset) так и делал,
  // а смена из кабинета — нет.
  const token = await currentToken();
  if (token) await destroyOtherSessions(user.id, token);
  await audit(user.email, "auth.password_change");
  return NextResponse.json({ data: { ok: true } });
});
