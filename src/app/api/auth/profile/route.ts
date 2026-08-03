import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, safeUser, randomToken, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/rbac-store";
import { sendEmail, verifyEmailMessage } from "@/lib/email";

const STR = ["name", "displayName", "avatar", "banner", "bio", "phone", "locale", "timezone"] as const;

export const PATCH = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const body = await readBody(req);
  const data: Record<string, unknown> = {};
  for (const k of STR) if (typeof body[k] === "string") data[k] = body[k];
  if (Array.isArray(body.socials)) data.socials = JSON.stringify(body.socials);
  if (body.notifPrefs && typeof body.notifPrefs === "object") data.notifPrefs = JSON.stringify(body.notifPrefs);
  if (body.privacy && typeof body.privacy === "object") data.privacy = JSON.stringify(body.privacy);

  let verifyToken: string | undefined;
  // Смена почты — как в нижнем регистре, так и с проверкой пароля.
  const newEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (newEmail && newEmail !== user.email) {
    // Требуем текущий пароль. Без этого угнанная сессия превращалась в
    // безвозвратный захват: злоумышленник менял почту на свою и дальше
    // восстанавливал пароль уже на неё.
    if (!user.passwordHash || typeof body.currentPassword !== "string" || !verifyPassword(body.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: { message: "Для смены e-mail введите текущий пароль." } }, { status: 403 });
    }
    if (await prisma.appUser.findUnique({ where: { email: newEmail } })) {
      return NextResponse.json({ error: { message: "Email уже занят." } }, { status: 409 });
    }
    verifyToken = randomToken(8);
    data.email = newEmail; data.emailVerified = false; data.verifyToken = verifyToken;
    const vm = verifyEmailMessage(newEmail, verifyToken);
    await sendEmail({ to: newEmail, subject: vm.subject, html: vm.html });
    // Предупреждаем старый адрес: владелец должен узнать о смене, даже если
    // доступ к аккаунту уже потерян.
    await sendEmail({
      to: user.email,
      subject: "E-mail вашего аккаунта изменён",
      html: `<p>E-mail аккаунта на Asosiy Aktiv изменён на <b>${newEmail}</b>.</p><p>Если это были не вы — немедленно свяжитесь с редакцией.</p>`,
    }).catch(() => { /* уведомление не должно ломать саму операцию */ });
  }

  const updated = await prisma.appUser.update({ where: { id: user.id }, data: data as never });
  await audit(user.email, "profile.update");
  // код подтверждения email отдаём только в dev (в проде — письмом)
  return NextResponse.json(process.env.NODE_ENV !== "production" ? { data: safeUser(updated), verifyToken } : { data: safeUser(updated) });
});
