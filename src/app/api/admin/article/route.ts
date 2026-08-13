import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { updateArticleAsModerator, setBreaking } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";
import { validateTranslations, validateCategory, validateMisc } from "@/lib/article-validate";

// Правка чужого материала модератором (ТЗ, блок 3).
//
// Право то же, что и на публикацию: кто может выпустить материал в свет, тот
// может и поправить в нём ошибку. Отдельного права заводить не стали — иначе
// у половины редакции была бы кнопка «Одобрить» без возможности исправить
// опечатку, ради которой материал возвращают автору.
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("news.publish");
  if (g.error) return g.error;

  const { id, translations, categorySlug, cover, tags, breaking } = await readBody(req);
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: { message: "Не указан материал." } }, { status: 400 });
  }

  // Те же ограничения, что и у автора: иначе правка становится обходным путём
  // мимо всех проверок длины и существования рубрики.
  const bad =
    validateTranslations(translations ?? null) ??
    (await validateCategory(categorySlug)) ??
    validateMisc({ tags, cover });
  if (bad) return NextResponse.json({ error: { field: bad.field, message: bad.message } }, { status: 400 });

  // Срочность — отдельное решение и отдельное поле: её ставят и снимают
  // независимо от правки текста, иногда прямо из очереди.
  if (breaking !== undefined) {
    const on = Boolean(breaking?.on ?? breaking);
    const hours = Number(breaking?.hours ?? 24);
    const r = await setBreaking(id, on, Number.isFinite(hours) ? hours : 24);
    if (translations === undefined) return NextResponse.json({ data: r });
  }

  const res = await updateArticleAsModerator(id, { translations, categorySlug, cover, tags });
  if ("error" in res) {
    const code = res.error === "NOT_FOUND" ? 404 : 400;
    const message = res.error === "EMPTY" ? "Заполните хотя бы одну языковую версию." : res.error;
    return NextResponse.json({ error: { message } }, { status: code });
  }
  return NextResponse.json({ data: res });
});
