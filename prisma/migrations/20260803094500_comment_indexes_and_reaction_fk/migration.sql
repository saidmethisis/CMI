-- Индексы для комментариев и связь реакций с комментарием.
--
-- Зачем индексы: PostgreSQL не индексирует внешние ключи автоматически, поэтому
-- каждый показ статьи сканировал таблицу комментариев целиком.
--
-- Зачем внешний ключ: без него реакции оставались в базе навсегда после удаления
-- комментария, а «лайк» несуществующего id спокойно записывался.

-- Сначала убираем реакции, которые ссылаются в пустоту, — иначе добавление
-- внешнего ключа упадёт с ошибкой 23503 на любой базе, где такие строки есть.
DELETE FROM "CommentReaction" r
USING (
  SELECT r2.id
  FROM "CommentReaction" r2
  LEFT JOIN "Comment" c ON c.id = r2."commentId"
  WHERE c.id IS NULL
) orphan
WHERE r.id = orphan.id;

-- CreateIndex
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
