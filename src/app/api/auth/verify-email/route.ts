import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// Demo email verification (real build sends a link by email).
export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const { token } = await readBody(req);
  if (!user.verifyToken || token !== user.verifyToken) {
    return NextResponse.json({ error: { message: "Неверный код подтверждения." } }, { status: 400 });
  }
  await prisma.appUser.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: "" } });
  return NextResponse.json({ data: { ok: true } });
});
