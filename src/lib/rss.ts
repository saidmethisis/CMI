import { SITE_URL } from "./site";

const esc = (s: string) =>
  String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));

export interface RssItem { title: string; path: string; description?: string; author?: string; category?: string; date: string; image?: string }

export function buildRss(opts: { title: string; description: string; selfPath: string; items: RssItem[] }): string {
  const now = new Date().toUTCString();
  const items = opts.items.map((i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${SITE_URL}${i.path}</link>
      <guid isPermaLink="true">${SITE_URL}${i.path}</guid>
      <description>${esc(i.description ?? "")}</description>${i.author ? `\n      <dc:creator>${esc(i.author)}</dc:creator>` : ""}${i.category ? `\n      <category>${esc(i.category)}</category>` : ""}
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>${i.image ? `\n      <enclosure url="${esc(i.image)}" type="image/jpeg" length="0"/>` : ""}
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(opts.title)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}${opts.selfPath}" rel="self" type="application/rss+xml"/>
    <description>${esc(opts.description)}</description>
    <language>ru</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Asosiy Aktiv</generator>
${items}
  </channel>
</rss>`;
}

export function rssResponse(xml: string) {
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } });
}
