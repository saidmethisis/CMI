import { listPublished, getCategories } from "@/lib/store";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

// Читает базу, поэтому рендерится по запросу, а не на этапе сборки:
// в Docker-образе на момент `next build` базы ещё нет, а для новостной ленты
// снимок на момент сборки всё равно был бы устаревшим.
export const dynamic = "force-dynamic";

// llms.txt — a markdown index for large language models (see llmstxt.org)
export async function GET() {
  const [arts, cats] = await Promise.all([listPublished(), getCategories()]);
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESC}`,
    "",
    "Asosiy Aktiv — деловое цифровое СМИ (Узбекистан, Центральная Азия): бизнес, технологии, финансы, рынки, дипломатия, стартапы.",
    "",
    "## Разделы",
    ...cats.map((c) => `- [${c.name}](${SITE_URL}/category/${c.slug})`),
    "",
    "## Последние материалы",
    ...arts.slice(0, 50).map((a) => `- [${a.title}](${SITE_URL}/article/${a.slug}): ${a.lead}`),
    "",
    "## Каналы",
    `- RSS (последние): ${SITE_URL}/feed.xml`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    `- Поиск: ${SITE_URL}/search?q={query}`,
  ].join("\n");
  return new Response(lines, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
