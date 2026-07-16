import { listPublished } from "@/lib/store";
import { buildRss, rssResponse, type RssItem } from "@/lib/rss";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 600;

export async function GET() {
  const items: RssItem[] = (await listPublished()).slice(0, 40).map((a) => ({
    title: a.title, path: `/article/${a.slug}`, description: a.lead, author: a.authorName, category: a.categorySlug, date: a.createdAt, image: a.cover,
  }));
  return rssResponse(buildRss({ title: `${SITE_NAME} — Последние публикации`, description: "Свежие материалы Asosiy Aktiv", selfPath: "/feed.xml", items }));
}
