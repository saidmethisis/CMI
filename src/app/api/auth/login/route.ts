import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, SESSION_COOKIE, sessionCookieOptions, verifyRecaptcha, safeUser, loginBlocked, recordFail, resetFails, make2faChallenge, verify2faChallenge } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { decryptSecret } from "@/lib/secretbox";
import { ensureRbacSeed, audit } from "@/lib/rbac-store";

export const POST = withHandler(async (req: Request) => {
  await ensureRbacSeed();
  const { email, password, human, code, challenge } = await readBody(req);
  // на шаге 2 (ввод 2FA-кода) капчу не требуем повторно — доверяем подписанному челленджу
  const step2 = !!(challenge && verify2faChallenge(email, challenge));
  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  const key = `${email}|${ip}`;
  const emailKey = `email:${email}`; // глобальный лок по аккаунту — ротация IP не обходит

  if (loginBlocked(key) || loginBlocked(emailKey)) {
    return NextResponse.json({ error: { message: "Слишком много попыток. Попробуйте позже." } }, { status: 429 });
  }
  if (!step2 && !(await verifyRecaptcha(human))) {
    return NextResponse.json({ error: { message: "Подтвердите, что вы не робот." } }, { status: 400 });
  }

  const user = await prisma.appUser.findUnique({ where: { email } });
  const ok = user && user.status === "active" && verifyPassword(password ?? "", user.passwordHash);
  if (!ok) {
    const left = recordFail(key);
    recordFail(emailKey);
    await audit(email ?? "?", "auth.login_fail");
    const msg = user && user.status !== "active" ? "Аккаунт заблокирован или отключён." : `Неверный email или пароль. Осталось попыток: ${Math.max(0, left)}.`;
    return NextResponse.json({ error: { message: msg } }, { status: 401 });
  }

  // второй фактор: если включён — требуем корректный TOTP-код
  if (user.twoFactor) {
    if (!code) return NextResponse.json({ error: { code: "2FA_REQUIRED", message: "Введите код из приложения-аутентификатора." }, twoFactorRequired: true, challenge: make2faChallenge(email) }, { status: 401 });
    if (!verifyTOTP(decryptSecret(user.twoFactorSecret), code)) {
      const left = recordFail(key);
      recordFail(emailKey);
      return NextResponse.json({ error: { code: "2FA_INVALID", message: `Неверный код 2FA. Осталось попыток: ${Math.max(0, left)}.` }, twoFactorRequired: true, challenge: make2faChallenge(email) }, { status: 401 });
    }
  }

  resetFails(key);
  resetFails(emailKey);
  const token = await createSession(user.id);
  await audit(email, "auth.login");
  const res = NextResponse.json({ data: safeUser(user), twoFactor: user.twoFactor });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
});
