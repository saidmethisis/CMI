import { listPublished, localizedArticle } from "@/lib/store";
import { SITE_NAME } from "@/lib/site";
import { langUrl } from "@/lib/i18n-server";
import type { LangCode } from "@/lib/types";

// Новостная карта сайта — отдельная от обычной, по формату Google News.
//
// Обычный sitemap.xml говорит роботу «эти страницы существуют». Новостная
// карта говорит «эти материалы вышли только что» и открывает попадание в
// «Главные новости» и Google News, где решают часы, а не дни. Формат жёсткий:
// только материалы за последние двое суток, не больше 1000 адресов, у каждого
// обязательны издание, язык, дата выхода и заголовок.
//
// Ни у kun.uz, ни у spot.uz, ни у gazeta.uz, ни у daryo.uz рабочей новостной
// карты нет — у daryo по этому адресу стоит перенаправление на главную.
//
// Каждая языковая версия идёт отдельной записью со своим news:language:
// для Google это разные материалы, а не переводы одного.
export const dynamic = "force-dynamic";

const LANGS: LangCode[] = ["ru", "uz", "en"];
const WINDOW_HOURS = 48;
const MAX_URLS = 1000;

// Время в формате W3C Datetime без долей секунды: 2026-08-19T07:21:28+00:00.
// Миллисекунды, которые по умолчанию даёт toISOString, строгие разборщики карт
// не принимают — на основной карте сайта Яндекс из-за них забраковал все адреса.
const stamp = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const since = Date.now() - WINDOW_HOURS * 3600 * 1000;
  const fresh = (await listPublished())
    .filter((a) => new Date(a.createdAt).getTime() >= since)
    .slice(0, Math.floor(MAX_URLS / LANGS.length));

  const urls = fresh.flatMap((a) =>
    LANGS.map((lang) => {
      const { title } = localizedArticle(a, lang);
      return [
        "  <url>",
        `    <loc>${esc(langUrl(lang, `/n/${a.slug}`))}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${esc(SITE_NAME)}</news:name>`,
        `        <news:language>${lang}</news:language>`,
        "      </news:publication>",
        `      <news:publication_date>${stamp(new Date(a.createdAt))}</news:publication_date>`,
        `      <news:title>${esc(title)}</news:title>`,
        "    </news:news>",
        a.cover ? `    <image:image><image:loc>${esc(new URL(a.cover, langUrl("ru", "/")).toString())}</image:loc></image:image>` : "",
        "  </url>",
      ].filter(Boolean).join("\n");
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Пять минут: свежесть здесь важнее экономии, но робот заходит часто.
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
