import type { MetadataRoute } from "next";
import { listPublished, getCategories } from "@/lib/store";
import { listAuthors } from "@/lib/rbac-store";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [published, categories, authors] = await Promise.all([listPublished(), getCategories(), listAuthors()]);
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/topics`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/for-companies`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/search`, lastModified: now, priority: 0.3 },
    // правовые страницы — важны при проверке
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/legal`, lastModified: now, priority: 0.3 },
    ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...authors.map((a) => ({ url: `${SITE_URL}/author/${a.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...published.map((a) => ({
      url: `${SITE_URL}/article/${a.slug}`,
      lastModified: new Date(a.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
      images: a.cover ? [a.cover] : undefined,
    })),
  ];
}
