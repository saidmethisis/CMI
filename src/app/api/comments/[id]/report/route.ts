import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { reportComment } from "@/lib/comments";
import { guardRate } from "@/lib/rate-limit";

export const POST = withHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Войдите, чтобы пожаловаться." } }, { status: 401 });
  const rl = await guardRate("report", user.id); if (rl) return rl;
  const res = await reportComment(id, user.id);
  if ("error" in res) {
    const msg = res.error === "OWN" ? "Нельзя пожаловаться на свой комментарий." : "Комментарий не найден.";
    return NextResponse.json({ error: { message: msg } }, { status: res.error === "OWN" ? 422 : 404 });
  }
  return NextResponse.json({ data: res });
});
