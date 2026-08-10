import Link from "next/link";
import { listPublished, localizeList, getCategories } from "@/lib/store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import Cover from "@/components/Cover";

// Раздел «Видео» из нижней панели. Собирает материалы, у которых задано видео:
// на главной они и раньше шли отдельной лентой, но своей страницы не имели.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("vid.title"), description: t("vid.subtitle"), alternates: await langAlternates("/video") };
}

export default async function VideoPage() {
  const { t, lang } = await serverT();
  const [all, categories] = await Promise.all([
    listPublished().then((x) => localizeList(x, lang)).catch(() => []),
    getCategories().catch(() => []),
  ]);
  const items = all.filter((a) => a.videoUrl);
  const catOf = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <div className="container-content py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("vid.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("vid.subtitle")}</p>

      {items.length === 0 ? (
        <p className="card p-6 text-center text-black/60 dark:text-white/65">{t("vid.empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const cat = catOf(a.categorySlug);
            return (
              <Link key={a.id} href={`/article/${a.slug}`} className="group">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black/[0.06] dark:bg-white/[0.08]">
                  {a.cover && (
                    <Cover src={a.cover} alt={a.title} width={640} height={360} sizes="(max-width: 640px) 100vw, 360px"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  )}
                  {/* Значок воспроизведения — чистый CSS, без файла-картинки */}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 ring-2 ring-white/80">
                      <span className="ml-1 h-0 w-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-white" />
                    </span>
                  </span>
                </div>
                {cat && (
                  <span className="mt-2 inline-block text-xs font-bold uppercase" style={{ color: cat.color }}>
                    {localizeName(lang, cat)}
                  </span>
                )}
                <h2 className="mt-0.5 font-serif text-lg font-bold leading-snug group-hover:text-accent">{a.title}</h2>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  {a.company ?? a.authorName} · {a.readingMinutes} {t("common.min")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
