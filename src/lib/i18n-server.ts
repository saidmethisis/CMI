import { cookies, headers } from "next/headers";
import { translate, type Lang } from "./dictionaries";
import { SITE_URL } from "./site";

const LANGS: Lang[] = ["ru", "uz", "en"];
// Русский — язык по умолчанию и живёт без префикса в адресе.
const DEFAULT_LANG: Lang = "ru";

// Язык страницы. Приоритет: префикс в адресе (/uz/…, /en/…, его проставляет
// middleware заголовком) → cookie → русский. Префикс важнее cookie: ссылка на
// конкретную языковую версию должна открываться на этом языке у любого читателя,
// иначе поисковый робот и человек по ссылке видели бы разное.
export async function getLang(): Promise<Lang> {
  const h = await headers();
  const fromPath = h.get("x-aktiv-lang");
  if (fromPath === "uz" || fromPath === "en") return fromPath;
  const c = await cookies();
  const v = c.get("aktiv_lang")?.value;
  return v === "uz" || v === "en" ? v : DEFAULT_LANG;
}

export async function serverT(): Promise<{ lang: Lang; t: (k: string) => string }> {
  const lang = await getLang();
  return { lang, t: (k: string) => translate(lang, k) };
}

// Адрес страницы на конкретном языке. Русский — без префикса.
export function langUrl(lang: Lang, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  return lang === DEFAULT_LANG ? `${SITE_URL}${suffix || "/"}` : `${SITE_URL}/${lang}${suffix}`;
}

// Готовый блок alternates для generateMetadata: canonical текущего языка плюс
// hreflang на все версии. Без этого Google не знает, что /uz/… и /en/… —
// переводы одной страницы, а не дубли.
export async function langAlternates(path = "/") {
  const lang = await getLang();
  return {
    canonical: langUrl(lang, path),
    languages: {
      ru: langUrl("ru", path),
      uz: langUrl("uz", path),
      en: langUrl("en", path),
      "x-default": langUrl(DEFAULT_LANG, path),
    },
  };
}
