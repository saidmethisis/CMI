import { listPublished, getCategories } from "@/lib/store";
import { buildRss, rssResponse, type RssItem } from "@/lib/rss";
import { SITE_NAME } from "@/lib/site";

// Читает базу, поэтому рендерится по запросу, а не на этапе сборки:
// в Docker-образе на момент `next build` базы ещё нет, а для новостной ленты
// снимок на момент сборки всё равно был бы устаревшим.
export const dynamic = "force-dynamic";

// Category / "news" RSS feed:  /rss/<categorySlug>  or  /rss/news
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === slug);
  const items: RssItem[] = (await listPublished(cat ? { category: slug } : {})).slice(0, 40).map((a) => ({
    title: a.title, path: `/article/${a.slug}`, description: a.lead, author: a.authorName, category: a.categorySlug, date: a.createdAt, image: a.cover,
  }));
  const title = cat ? `${SITE_NAME} — ${cat.name}` : `${SITE_NAME} — Новости`;
  return rssResponse(buildRss({ title, description: `RSS-лента: ${cat?.name ?? "новости"}`, selfPath: `/rss/${slug}`, items }));
}
