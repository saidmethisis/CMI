import { listPublished } from "@/lib/store";
import { getAuthor } from "@/lib/rbac-store";
import { buildRss, rssResponse, type RssItem } from "@/lib/rss";
import { SITE_NAME } from "@/lib/site";

// Читает базу, поэтому рендерится по запросу, а не на этапе сборки:
// в Docker-образе на момент `next build` базы ещё нет, а для новостной ленты
// снимок на момент сборки всё равно был бы устаревшим.
export const dynamic = "force-dynamic";

// Author RSS feed:  /rss/author/<authorSlug>
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAuthor(slug);
  const name = a ? `${a.firstName} ${a.lastName}` : slug;
  const items: RssItem[] = (await listPublished()).filter((x) => x.authorName === name).slice(0, 40).map((x) => ({
    title: x.title, path: `/n/${x.slug}`, description: x.lead, author: x.authorName, category: x.categorySlug, date: x.createdAt, image: x.cover,
  }));
  return rssResponse(buildRss({ title: `${SITE_NAME} — ${name}`, description: `Материалы автора: ${name}`, selfPath: `/rss/author/${slug}`, items }));
}
