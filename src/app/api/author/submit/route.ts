import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { submitUgcArticle } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";
import { validateTranslations, validateCategory, validateMisc } from "@/lib/article-validate";

// Writer submits a draft/for-moderation article; owner is the logged-in user.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { title, lead, body, categorySlug, tags, authorName, cover, videoUrl, socials, asDraft, translations } = await readBody(req);
  // Материал многоязычный: достаточно одной полностью заполненной языковой версии.
  const langs = translations && typeof translations === "object" ? (translations as Record<string, { title?: string; lead?: string; body?: string }>) : null;
  // Проверяем только поддерживаемые языки: store читает ru/uz/en, и запрос вида
  // { translations: { de: {...} } } проходил валидацию, а затем создавал статью
  // с пустыми заголовком и текстом.
  const SUPPORTED = ["ru", "uz", "en"] as const;
  const hasCompleteLang = langs
    ? SUPPORTED.some((l) => langs[l]?.title?.trim() && langs[l]?.lead?.trim() && langs[l]?.body?.trim())
    : !!(title && lead && body);
  if (!hasCompleteLang) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Заполните заголовок, лид и текст хотя бы на одном языке." } }, { status: 422 });
  }
  // Длины полей, существование рубрики и формат обложки — см. article-validate.ts
  const bad = validateTranslations(langs, { title, lead, body })
    ?? validateMisc({ tags, cover })
    ?? (await validateCategory(categorySlug));
  if (bad) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", field: bad.field, message: bad.message } }, { status: 422 });
  }
  const res = await submitUgcArticle({
    title: title || "", lead: lead || "", body: body || "", categorySlug, tags: tags || "",
    authorName: authorName || g.user.displayName || g.user.name,
    authorUserId: g.user.id, cover, videoUrl, socials, asDraft: !!asDraft, translations: langs ?? undefined,
  });
  return NextResponse.json({ data: res }, { status: 201 });
});
