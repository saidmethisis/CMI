import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { updateOwnArticle, deleteOwnArticle } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Writer edits/deletes ONLY their own articles (ownership enforced in the store).
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("news.edit_own");
  if (g.error) return g.error;
  const { id, ...patch } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });
  const res = await updateOwnArticle(id, g.user.id, patch);
  if ("error" in res) {
    const msg = res.error === "FORBIDDEN" ? "Можно редактировать только свои статьи." : "Статья не найдена.";
    return NextResponse.json({ error: { message: msg } }, { status: res.error === "FORBIDDEN" ? 403 : 404 });
  }
  return NextResponse.json({ data: res });
});

export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("news.edit_own");
  if (g.error) return g.error;
  const { id } = await readBody(req);
  const res = await deleteOwnArticle(id, g.user.id);
  if ("error" in res) {
    const msg = res.error === "FORBIDDEN" ? "Можно удалять только свои статьи." : "Статья не найдена.";
    return NextResponse.json({ error: { message: msg } }, { status: res.error === "FORBIDDEN" ? 403 : 404 });
  }
  return NextResponse.json({ data: res });
});
