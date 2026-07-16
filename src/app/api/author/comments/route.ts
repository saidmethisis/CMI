import { NextResponse } from "next/server";
import { readBody, apiError, withHandler } from "@/lib/api";
import { apiGuard } from "@/lib/api-guard";
import { commentsByAuthor, moderateOwnComment, deleteOwnComment } from "@/lib/comments";

// Комментарии к СВОИМ статьям + модерация (одобрить/спам/удалить) — для писателя.
export const GET = withHandler(async () => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  return NextResponse.json({ data: await commentsByAuthor(g.user.id) });
});

export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { id, status } = await readBody(req);
  if (!id || !["approved", "spam", "rejected", "pending"].includes(status)) return apiError("Нужны id и корректный статус.", 422);
  const res = await moderateOwnComment(id, g.user.id, status);
  if ("error" in res) return apiError("Можно модерировать только комментарии к своим статьям.", 403);
  return NextResponse.json({ data: { ok: true } });
});

export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { id } = await readBody(req);
  if (!id) return apiError("id обязателен.", 422);
  const res = await deleteOwnComment(id, g.user.id);
  if ("error" in res) return apiError("Можно удалять только комментарии к своим статьям.", 403);
  return NextResponse.json({ data: { ok: true } });
});
