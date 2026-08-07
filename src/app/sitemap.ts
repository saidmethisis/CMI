import type { MetadataRoute } from "next";
import { listPublished, getCategories } from "@/lib/store";
import { listAuthors } from "@/lib/rbac-store";
import { langUrl } from "@/lib/i18n-server";

// Читает базу, поэтому рендерится по запросу, а не на этапе сборки:
// в Docker-образе на момент `next build` базы ещё нет, а для новостной ленты
// снимок на момент сборки всё равно был бы устаревшим.
export const dynamic = "force-dynamic";

// Каждая запись перечисляет все языковые версии страницы.
// Без alternates робот не понимает, что /uz/… и /en/… — переводы, а не дубли,
// и индексирует только русскую версию (раньше других адресов просто не было).
function entry(path: string, rest: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] {
  return {
    url: langUrl("ru", path),
    alternates: { languages: { ru: langUrl("ru", path), uz: langUrl("uz", path), en: langUrl("en", path) } },
    ...rest,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [published, categories, authors] = await Promise.all([listPublished(), getCategories(), listAuthors()]);
  return [
    entry("/", { lastModified: now, changeFrequency: "hourly", priority: 1 }),
    entry("/topics", { lastModified: now, priority: 0.6 }),
    entry("/for-companies", { lastModified: now, priority: 0.5 }),
    entry("/search", { lastModified: now, priority: 0.3 }),
    // правовые страницы — важны при проверке
    entry("/privacy", { lastModified: now, priority: 0.3 }),
    entry("/terms", { lastModified: now, priority: 0.3 }),
    entry("/legal", { lastModified: now, priority: 0.3 }),
    ...categories.map((c) => entry(`/category/${c.slug}`, { lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...authors.map((a) => entry(`/author/${a.slug}`, { lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...published.map((a) =>
      entry(`/article/${a.slug}`, {
        lastModified: new Date(a.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.8,
        images: a.cover ? [a.cover] : undefined,
      }),
    ),
  ];
}
