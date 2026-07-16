import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();
    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user || !user.resetToken || user.resetToken !== token) {
      return NextResponse.json({ error: { message: "Неверный или просроченный токен." } }, { status: 400 });
    }
    // проверка срока действия (токен вида "<rand>.<expMs>")
    const exp = Number(String(token).split(".")[1]);
    if (!exp || exp < Date.now()) {
      await prisma.appUser.update({ where: { id: user.id }, data: { resetToken: "" } }).catch(() => {});
      return NextResponse.json({ error: { message: "Срок действия токена истёк. Запросите сброс заново." } }, { status: 400 });
    }
    if (!password || String(password).length < 8) {
      return NextResponse.json({ error: { message: "Пароль минимум 8 символов." } }, { status: 422 });
    }
    await prisma.appUser.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password), resetToken: "" } });
    // сброс пароля завершает все прочие сессии пользователя
    await prisma.session.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: { message: "Ошибка запроса." } }, { status: 400 });
  }
}
