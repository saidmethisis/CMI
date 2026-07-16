import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { reportComment } from "@/lib/comments";

export const POST = withHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Войдите, чтобы пожаловаться." } }, { status: 401 });
  return NextResponse.json({ data: await reportComment(id) });
});
