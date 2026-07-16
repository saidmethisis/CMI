import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { reactComment } from "@/lib/comments";

export const POST = withHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Войдите, чтобы голосовать." } }, { status: 401 });
  const { type } = await readBody(req);
  if (type !== "like" && type !== "dislike") return NextResponse.json({ error: { message: "bad type" } }, { status: 422 });
  return NextResponse.json({ data: await reactComment(id, user.id, type) });
});
