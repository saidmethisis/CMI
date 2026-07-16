import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { submitPrArticle } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// PR partner submits a generated article to moderation. Decrements the counter.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create"); if (g.error) return g.error;
  const { title, lead, body, company, categorySlug } = await readBody(req);
  const res = await submitPrArticle({ title, lead, body, company, categorySlug });
  if ("error" in res) {
    return NextResponse.json({ error: { code: "LIMIT_REACHED", message: "Лимит публикаций исчерпан. Обновите тариф." } }, { status: 403 });
  }
  return NextResponse.json({ data: res }, { status: 201 });
});
