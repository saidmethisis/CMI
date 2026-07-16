import { cookies } from "next/headers";
import { translate, type Lang } from "./dictionaries";

// Server-side translator: reads the language from the aktiv_lang cookie.
export async function getLang(): Promise<Lang> {
  const c = await cookies();
  const v = c.get("aktiv_lang")?.value;
  return v === "uz" || v === "en" ? v : "ru";
}

export async function serverT(): Promise<{ lang: Lang; t: (k: string) => string }> {
  const lang = await getLang();
  return { lang, t: (k: string) => translate(lang, k) };
}
