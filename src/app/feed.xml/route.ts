import { listPublished } from "@/lib/store";
import { buildRss, rssResponse, type RssItem } from "@/lib/rss";
import { SITE_NAME } from "@/lib/site";

// Читает базу, поэтому рендерится по запросу, а не на этапе сборки:
// в Docker-образе на момент `next build` базы ещё нет, а для новостной ленты
// снимок на момент сборки всё равно был бы устаревшим.
export const dynamic = "force-dynamic";

export async function GET() {
  const items: RssItem[] = (await listPublished()).slice(0, 40).map((a) => ({
    title: a.title, path: `/n/${a.slug}`, description: a.lead, author: a.authorName, category: a.categorySlug, date: a.createdAt, image: a.cover,
  }));
  return rssResponse(buildRss({ title: `${SITE_NAME} — Последние публикации`, description: "Свежие материалы Asosiy Aktiv", selfPath: "/feed.xml", items }));
}
