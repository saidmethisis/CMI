import { listPublished, getCategories } from "@/lib/store";
import { listAuthors } from "@/lib/rbac-store";
import { langUrl } from "@/lib/i18n-server";

// Карта сайта.
//
// Раньше её собирал встроенный механизм Next (файл sitemap.ts), и формат он
// выбирал сам: время с миллисекундами (2026-08-19T10:06:48.322Z) и теги
// hreflang между <loc> и <lastmod>. Google это принимал, а Яндекс забраковал
// все 32 адреса до единого — то есть карта не работала ровно там, где нужнее
// всего, в основном для нас поисковике.
//
// Поэтому собираем XML сами и держимся схемы буквально: внутри <url> элементы
// идут строго в порядке loc → lastmod → changefreq → priority, время без долей
// секунды, никаких посторонних пространств имён. Языковые версии объявлены в
// <head> каждой страницы тегами hreflang — и Google, и Яндекс читают их
// оттуда, дублировать в карте незачем.
//
// Читает базу, поэтому рендерится по запросу: в Docker-образе на момент сборки
// базы ещё нет, а для новостной ленты снимок на момент сборки устарел бы сразу.
export const dynamic = "force-dynamic";

type Entry = { path: string; lastmod: Date; changefreq?: string; priority: number };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// W3C Datetime без долей секунды: 2026-08-19T10:06:48+00:00.
// Именно такой вид приведён в примерах и sitemaps.org, и Яндекса.
const stamp = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");

export async function GET() {
  const now = new Date();
  const [published, categories, authors] = await Promise.all([listPublished(), getCategories(), listAuthors()]);

  const entries: Entry[] = [
    { path: "/", lastmod: now, changefreq: "hourly", priority: 1 },
    { path: "/about", lastmod: now, priority: 0.7 },
    { path: "/topics", lastmod: now, priority: 0.6 },
    { path: "/for-companies", lastmod: now, priority: 0.5 },
    { path: "/search", lastmod: now, priority: 0.3 },
    // правовые страницы — их смотрят при проверке издания
    { path: "/privacy", lastmod: now, priority: 0.3 },
    { path: "/terms", lastmod: now, priority: 0.3 },
    { path: "/legal", lastmod: now, priority: 0.3 },
    ...categories.map((c) => ({ path: `/category/${c.slug}`, lastmod: now, changefreq: "daily", priority: 0.7 })),
    ...authors.map((a) => ({ path: `/author/${a.slug}`, lastmod: now, changefreq: "weekly", priority: 0.5 })),
    ...published.map((a) => ({
      path: `/n/${a.slug}`,
      lastmod: new Date(a.createdAt),
      changefreq: "daily",
      priority: 0.8,
    })),
  ];

  // Каждая языковая версия — отдельный адрес: у неё свой текст, свой заголовок
  // и своё место в выдаче. Родство между ними объявлено в разметке страниц.
  const urls = entries.flatMap((e) =>
    (["ru", "uz", "en"] as const).map((l) => ({ ...e, loc: langUrl(l, e.path) })),
  );

  const body = urls
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${esc(u.loc)}</loc>\n` +
        `    <lastmod>${stamp(u.lastmod)}</lastmod>\n` +
        (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : "") +
        `    <priority>${u.priority.toFixed(1)}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
