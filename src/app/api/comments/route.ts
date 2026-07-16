import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { getCommentsTree, addComment } from "@/lib/comments";
import { audit } from "@/lib/rbac-store";

export const GET = withHandler(async (req: Request) => {
  const articleId = new URL(req.url).searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: { message: "articleId обязателен" } }, { status: 422 });
  const user = await currentUser();
  return NextResponse.json({ data: await getCommentsTree(articleId, user?.id) });
});

// Stage 25: only registered users may comment.
export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Только зарегистрированные пользователи могут комментировать." } }, { status: 401 });
  const { articleId, body, parentId } = await readBody(req);
  if (!articleId || !body?.trim()) return NextResponse.json({ error: { message: "Пустой комментарий." } }, { status: 422 });
  const c = await addComment({ articleId, userId: user.id, author: user.displayName || user.name, avatar: user.avatar, body, parentId });
  await audit(user.email, "comment.create", articleId);
  return NextResponse.json({ data: { id: c.id, status: c.status } }, { status: 201 });
});
