import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, SESSION_COOKIE, verifyRecaptcha, safeUser, randomToken } from "@/lib/auth";
import { sendEmail, verifyEmailMessage } from "@/lib/email";
import { ensureRbacSeed, audit } from "@/lib/rbac-store";

// Stage 22/24: ONLY readers (subscriber) may self-register.
export const POST = withHandler(async (req: Request) => {
  await ensureRbacSeed();
  const { name, email, password, human, consent } = await readBody(req);
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: { message: "Заполните имя, email и пароль." } }, { status: 422 });
  }
  if (!consent) {
    return NextResponse.json({ error: { message: "Необходимо согласие на обработку персональных данных." } }, { status: 422 });
  }
  if (!(await verifyRecaptcha(human))) {
    return NextResponse.json({ error: { message: "Подтвердите, что вы не робот." } }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: { message: "Пароль должен быть не короче 8 символов." } }, { status: 422 });
  }
  if (await prisma.appUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: { message: "Пользователь с таким email уже существует." } }, { status: 409 });
  }
  const verifyTok = randomToken(8);
  const user = await prisma.appUser.create({
    data: { id: "u-" + Date.now().toString(36), name, displayName: name, email, passwordHash: hashPassword(password), roleSlug: "reader", status: "active", verifyToken: verifyTok, consentAt: new Date() },
  });
  await audit(email, "auth.register");
  const token = await createSession(user.id);
  const vm = verifyEmailMessage(email, verifyTok);
  const { sent } = await sendEmail({ to: email, subject: vm.subject, html: vm.html });
  // код подтверждения отдаём только если письмо не ушло (dev без ключа) — иначе утечка
  const exposeInDev = !sent && process.env.NODE_ENV !== "production";
  const res = NextResponse.json(
    exposeInDev ? { data: safeUser(user), verifyToken: verifyTok } : { data: safeUser(user) },
    { status: 201 },
  );
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 });
  return res;
});
