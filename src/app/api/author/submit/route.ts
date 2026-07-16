import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { submitUgcArticle } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Writer submits a draft/for-moderation article; owner is the logged-in user.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { title, lead, body, categorySlug, tags, authorName, cover, videoUrl, socials, asDraft } = await readBody(req);
  if (!title || !lead || !body) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Заполните заголовок, лид и текст." } }, { status: 422 });
  }
  const res = await submitUgcArticle({
    title, lead, body, categorySlug, tags: tags || "",
    authorName: authorName || g.user.displayName || g.user.name,
    authorUserId: g.user.id, cover, videoUrl, socials, asDraft: !!asDraft,
  });
  return NextResponse.json({ data: res }, { status: 201 });
});
