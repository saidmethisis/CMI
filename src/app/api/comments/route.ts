import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { getCommentsTree, addComment, COMMENT_MAX, REPLY_MAX_DEPTH } from "@/lib/comments";
import { audit } from "@/lib/rbac-store";
import { guardRate } from "@/lib/rate-limit";

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
  const rl = await guardRate("comment", user.id); if (rl) return rl;
  const { articleId, body, parentId } = await readBody(req);

  // Проверяем ТИПЫ, а не только наличие: `body` объектом или массивом
  // ронял обработчик в 500 на вызове .trim().
  if (typeof articleId !== "string" || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: { message: "Пустой комментарий." } }, { status: 422 });
  }
  if (parentId !== undefined && parentId !== null && typeof parentId !== "string") {
    return NextResponse.json({ error: { message: "Некорректный ответ." } }, { status: 422 });
  }
  // Ограничение длины: без него принимался комментарий на сотни тысяч символов —
  // это и раздувание базы, и сломанная вёрстка страницы статьи.
  if (body.length > COMMENT_MAX) {
    return NextResponse.json({ error: { message: `Комментарий длиннее ${COMMENT_MAX} символов.` } }, { status: 422 });
  }

  const c = await addComment({ articleId, userId: user.id, author: user.displayName || user.name, avatar: user.avatar, body, parentId: parentId ?? undefined });
  if ("error" in c) {
    const MSG: Record<string, [string, number]> = {
      ARTICLE_NOT_FOUND: ["Статья не найдена.", 404],
      ARTICLE_NOT_PUBLISHED: ["Статья ещё не опубликована.", 403],
      BAD_PARENT: ["Ответ относится к другой статье.", 422],
      TOO_DEEP: [`Слишком глубокая ветка ответов (максимум ${REPLY_MAX_DEPTH}).`, 422],
    };
    const [message, status] = MSG[c.error] ?? ["Не удалось добавить комментарий.", 422];
    return NextResponse.json({ error: { message } }, { status });
  }
  await audit(user.email, "comment.create", articleId);
  return NextResponse.json({ data: { id: c.id, status: c.status } }, { status: 201 });
});
