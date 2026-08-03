// Проверка полей статьи. Общая для создания (/api/author/submit) и правки
// (/api/author/article), иначе ограничение обходится вторым эндпоинтом.
//
// Зачем: без лимитов принимались заголовок на 50 000 символов и текст на 3 МБ —
// такая статья раздувает базу, ломает вёрстку карточек и ленты и грузится вечно.
// А статья с несуществующей рубрикой пропадала с сайта: её не находит ни страница
// рубрики, ни меню, при этом автор видел её как «опубликованную».
import { getCategories } from "./store";

export const LIMITS = {
  title: 300,
  lead: 1000,
  body: 200_000, // ~30 000 слов — заведомо больше любого лонгрида
  tags: 500,
  cover: 2000, // URL или /uploads/... ; data-URL сюда попадать не должен
} as const;

export type LangFields = { title?: string; lead?: string; body?: string };
export const SUPPORTED_LANGS = ["ru", "uz", "en"] as const;

export type ValidationError = { field: string; message: string };

// Проверяет длины во всех языковых версиях. Возвращает первую ошибку или null.
export function validateTranslations(langs: Record<string, LangFields> | null, flat?: LangFields): ValidationError | null {
  const versions: [string, LangFields][] = langs
    ? SUPPORTED_LANGS.filter((l) => langs[l]).map((l) => [l, langs[l]!])
    : flat ? [["ru", flat]] : [];

  for (const [lang, v] of versions) {
    if ((v.title ?? "").length > LIMITS.title) {
      return { field: `title.${lang}`, message: `Заголовок длиннее ${LIMITS.title} символов.` };
    }
    if ((v.lead ?? "").length > LIMITS.lead) {
      return { field: `lead.${lang}`, message: `Лид длиннее ${LIMITS.lead} символов.` };
    }
    if ((v.body ?? "").length > LIMITS.body) {
      return { field: `body.${lang}`, message: `Текст длиннее ${LIMITS.body} символов.` };
    }
  }
  return null;
}

// Рубрика должна реально существовать, иначе статья окажется недоступной.
export async function validateCategory(slug: unknown): Promise<ValidationError | null> {
  if (slug === undefined || slug === null || slug === "") return null; // необязательное поле — подставится дефолт
  if (typeof slug !== "string") return { field: "categorySlug", message: "Некорректная рубрика." };
  const cats = await getCategories();
  if (!cats.some((c) => c.slug === slug)) {
    return { field: "categorySlug", message: "Такой рубрики не существует." };
  }
  return null;
}

export function validateMisc(input: { tags?: unknown; cover?: unknown }): ValidationError | null {
  if (typeof input.tags === "string" && input.tags.length > LIMITS.tags) {
    return { field: "tags", message: `Список тегов длиннее ${LIMITS.tags} символов.` };
  }
  // Обложка должна быть ссылкой: data-URL раздувает строку в базе до мегабайтов.
  // Картинки загружаются через /api/upload и приходят сюда уже как /uploads/....
  if (typeof input.cover === "string") {
    if (input.cover.startsWith("data:")) return { field: "cover", message: "Загрузите обложку через форму — ссылка на файл, а не сам файл." };
    if (input.cover.length > LIMITS.cover) return { field: "cover", message: "Слишком длинная ссылка на обложку." };
  }
  return null;
}
