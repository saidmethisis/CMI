import { NextResponse } from "next/server";
import { readBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/auth";
import { sendEmail, resetEmail } from "@/lib/email";
import { ensureRbacSeed } from "@/lib/rbac-store";

// Восстановление пароля. В проде токен уходит на email; в ответе НЕ возвращается,
// иначе любой мог бы получить чужой reset-токен. В dev — отдаём для удобства тестов.
export async function POST(req: Request) {
  try {
    await ensureRbacSeed();
    const { email } = await readBody(req);
    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ data: { ok: true } }); // не раскрываем существование
    const token = `${randomToken(16)}.${Date.now() + 30 * 60 * 1000}`; // TTL 30 минут
    await prisma.appUser.update({ where: { id: user.id }, data: { resetToken: token } });
    const { subject, html } = resetEmail(email, token);
    const { sent } = await sendEmail({ to: email, subject, html });
    // Если письмо реально ушло — токен в ответе НЕ отдаём. Если почта не настроена — в dev возвращаем для теста.
    const exposeInDev = !sent && process.env.NODE_ENV !== "production";
    return NextResponse.json(exposeInDev ? { data: { ok: true }, resetToken: token } : { data: { ok: true } });
  } catch {
    return NextResponse.json({ error: { message: "Ошибка запроса." } }, { status: 400 });
  }
}
