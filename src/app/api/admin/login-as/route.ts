import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readBody, withHandler } from "@/lib/api";
import { audit, getUserById } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";
import { SESSION_COOKIE, sessionCookieOptions, createSession, destroySession, currentToken } from "@/lib/auth";

const RETURN_COOKIE = "aktiv_admin_return"; // токен исходной сессии администратора
const FLAG_COOKIE = "aktiv_impersonate"; // не-httpOnly флаг для баннера
const WINDOW = 60 * 60 * 2; // имперсонация живёт 2 часа

// Настоящий «Войти как пользователь» (только суперадмин): выдаёт реальную сессию
// целевого пользователя, а токен админа сохраняет, чтобы вернуться назад.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("users.login_as"); if (g.error) return g.error;
  const { userId } = await readBody(req);
  if (!userId) return NextResponse.json({ error: { message: "userId обязателен" } }, { status: 422 });
  if (userId === g.user.id) return NextResponse.json({ error: { message: "Нельзя войти как вы сами." } }, { status: 422 });
  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: { message: "Пользователь не найден." } }, { status: 404 });

  const adminToken = await currentToken();
  const targetToken = await createSession(target.id);
  await audit(g.user.displayName || g.user.name, "user.login_as", `${target.name} (${target.roleSlug})`);

  const res = NextResponse.json({ data: { ok: true, name: target.name, roleSlug: target.roleSlug } });
  res.cookies.set(SESSION_COOKIE, targetToken, { ...sessionCookieOptions, maxAge: WINDOW });
  if (adminToken) res.cookies.set(RETURN_COOKIE, adminToken, { ...sessionCookieOptions, maxAge: WINDOW });
  res.cookies.set(FLAG_COOKIE, JSON.stringify({ name: target.name, roleSlug: target.roleSlug }), { path: "/", maxAge: WINDOW, sameSite: "lax" });
  return res;
});

// Вернуться в свою учётную запись: восстанавливаем сессию администратора из RETURN_COOKIE.
// Без проверки прав — имперсонированный пользователь (writer) тоже должен уметь выйти.
export const DELETE = withHandler(async () => {
  const c = await cookies();
  const adminToken = c.get(RETURN_COOKIE)?.value;
  const currentImpersonation = c.get(SESSION_COOKIE)?.value;
  const res = NextResponse.json({ data: { ok: true, restored: !!adminToken } });
  if (adminToken) {
    // удаляем временную сессию имперсонации и возвращаем cookie на админа
    if (currentImpersonation && currentImpersonation !== adminToken) await destroySession(currentImpersonation);
    res.cookies.set(SESSION_COOKIE, adminToken, sessionCookieOptions);
    res.cookies.delete(RETURN_COOKIE);
  }
  res.cookies.delete(FLAG_COOKIE);
  return res;
});
