import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getArticle, localizedArticle } from "@/lib/store";
import { getLang } from "@/lib/i18n-server";

export const GET = withHandler(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "published") {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  // Отдаём тексты на языке читателя: этот эндпоинт кормит бесконечную ленту статей
  // и раздел «Избранное». Без локализации следующая статья в ленте открывалась
  // по-русски, даже когда перевод есть.
  const lang = await getLang();
  return NextResponse.json({ data: { ...a, ...localizedArticle(a, lang) } });
});
