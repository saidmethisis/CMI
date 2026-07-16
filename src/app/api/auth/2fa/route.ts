import { NextResponse } from "next/server";
import { readBody, apiError, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { generateSecret, otpauthUrl, verifyTOTP } from "@/lib/totp";
import { encryptSecret, decryptSecret } from "@/lib/secretbox";
import { audit } from "@/lib/rbac-store";

// Настоящая TOTP-двухфакторка (authenticator-приложение).
// init   → выдать секрет + otpauth-URL (QR/ручной ввод), 2FA пока НЕ включена
// enable → проверить код из приложения → включить
// disable→ проверить код → выключить и стереть секрет
export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return apiError("Не авторизован", 401);
  const { action, code } = await readBody(req);

  if (action === "init") {
    // не даём переинициализировать активную 2FA без ввода кода — иначе при угоне сессии её снимут
    const cur = await prisma.appUser.findUnique({ where: { id: user.id }, select: { twoFactor: true } });
    if (cur?.twoFactor) return apiError("2FA уже включена. Сначала отключите её, введя текущий код.", 400);
    const secret = generateSecret();
    await prisma.appUser.update({ where: { id: user.id }, data: { twoFactorSecret: encryptSecret(secret), twoFactor: false } });
    return NextResponse.json({ data: { secret, otpauth: otpauthUrl(secret, user.email) } });
  }

  if (action === "enable") {
    const u = await prisma.appUser.findUnique({ where: { id: user.id } });
    if (!u?.twoFactorSecret) return apiError("Сначала запросите секрет (init).", 400);
    if (!verifyTOTP(decryptSecret(u.twoFactorSecret), code)) return apiError("Неверный код. Проверьте время на устройстве.", 400);
    await prisma.appUser.update({ where: { id: user.id }, data: { twoFactor: true } });
    await audit(user.email, "auth.2fa_enable");
    return NextResponse.json({ data: { twoFactor: true } });
  }

  if (action === "disable") {
    const u = await prisma.appUser.findUnique({ where: { id: user.id } });
    if (u?.twoFactor && !verifyTOTP(decryptSecret(u.twoFactorSecret), code)) return apiError("Введите текущий код, чтобы отключить 2FA.", 400);
    await prisma.appUser.update({ where: { id: user.id }, data: { twoFactor: false, twoFactorSecret: "" } });
    await audit(user.email, "auth.2fa_disable");
    return NextResponse.json({ data: { twoFactor: false } });
  }

  return apiError("Неизвестное действие.", 422);
});
