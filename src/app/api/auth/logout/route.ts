import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withHandler } from "@/lib/api";
import { currentToken, destroySession, SESSION_COOKIE } from "@/lib/auth";

const RETURN_COOKIE = "aktiv_admin_return";
const FLAG_COOKIE = "aktiv_impersonate";

export const POST = withHandler(async () => {
  const token = await currentToken();
  if (token) await destroySession(token);

  // Если выходят прямо из имперсонализации, надо погасить и её. Иначе после «Выйти»
  // в браузере остаётся живой токен админа (aktiv_admin_return), и любой, кто сядет
  // за этот компьютер, вернёт себе сессию суперадмина одним запросом к login-as.
  const c = await cookies();
  const adminToken = c.get(RETURN_COOKIE)?.value;
  if (adminToken) await destroySession(adminToken);

  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(RETURN_COOKIE);
  res.cookies.delete(FLAG_COOKIE);
  return res;
});
