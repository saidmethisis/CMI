import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle, listPublished, getCategories } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import ArticleView from "@/components/ArticleView";
import LeadMedia from "@/components/LeadMedia";
import Comments from "@/components/Comments";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import InfiniteArticles from "@/components/InfiniteArticles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Не найдено" };
  return {
    title: a.title,
    description: a.lead,
    openGraph: { title: a.title, description: a.lead, images: [a.cover], type: "article" },
    twitter: { card: "summary_large_image", title: a.title, description: a.lead, images: [a.cover] },
    alternates: { canonical: `/article/${a.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "published") notFound();

  const { t, lang } = await serverT();
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === a.categorySlug);
  const catLabel = cat ? localizeName(lang, cat) : "";
  const all = await listPublished();
  // релевантность: общие теги (вес 3) + та же рубрика (вес 1), затем свежесть
  const aTags = new Set(a.tags ?? []);
  const scored = all.filter((x) => x.slug !== a.slug).map((x) => ({
    x, score: (x.tags ?? []).filter((tg) => aTags.has(tg)).length * 3 + (x.categorySlug === a.categorySlug ? 1 : 0),
  })).filter((s) => s.score > 0).sort((p, q) => q.score - p.score || (p.x.createdAt < q.x.createdAt ? 1 : -1));
  let related = scored.slice(0, 3).map((s) => s.x);
  if (related.length < 3) {
    const seen = new Set(related.map((r) => r.slug));
    related = [...related, ...all.filter((x) => x.categorySlug === a.categorySlug && x.slug !== a.slug && !seen.has(x.slug))].slice(0, 3);
  }
  // «Ещё от автора» — только для именных авторов, не для обобщённой редакции/PR-служб
  const isNamedAuthor = !!a.authorName && !/редакц|пресс-служб|editorial/i.test(a.authorName);
  const byAuthor = isNamedAuthor
    ? all.filter((x) => x.slug !== a.slug && x.authorName === a.authorName && !related.some((r) => r.slug === x.slug)).slice(0, 3)
    : [];
  const popular = [...all].sort((x, y) => y.views - x.views);
  // queue for infinite article-to-article scroll (recent, excluding current)
  const nextSlugs = all.filter((x) => x.slug !== a.slug).slice(0, 8).map((x) => x.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    image: [a.cover],
    datePublished: a.createdAt,
    dateModified: a.createdAt,
    author: [{ "@type": "Person", name: a.authorName }],
    publisher: { "@type": "NewsMediaOrganization", name: "Asosiy Aktiv" },
    articleSection: cat?.name,
    isAccessibleForFree: true,
    wordCount: a.body.split(/\s+/).length,
  };

  return (
    <div className="container-content py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <nav className="mb-3 text-xs text-black/50 dark:text-white/50">
            <Link href="/">{t("article.home")}</Link> ›{" "}
            <Link href={`/category/${a.categorySlug}`}>{catLabel}</Link>
          </nav>

          <header className="mb-5">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cat?.color }}>{catLabel}</span>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">{a.title}</h1>
            {/* compact teaser / summary line */}
            <p className="mt-3 text-lg text-black/60 dark:text-white/70">{a.lead}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-black/5 py-3 text-sm dark:border-white/10">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {(a.company ?? a.authorName).charAt(0)}
              </span>
              <div>
                <span className="font-semibold">{a.company ?? a.authorName}</span>
                <div className="text-xs text-black/50 dark:text-white/50">
                  {new Date(a.createdAt).toLocaleDateString(lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU", { day: "numeric", month: "long", year: "numeric" })} · {a.readingMinutes} {t("common.min")}
                  {a.authorKind === "pr" && ` · ${t("article.partner")}`}
                </div>
              </div>
            </div>
          </header>

          <LeadMedia cover={a.cover} videoUrl={a.videoUrl} title={a.title} />

          <ArticleView a={a} />

          <div className="mt-8 flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip hover:bg-black/5 dark:hover:bg-white/10">#{t}</Link>
            ))}
          </div>

          <Comments articleId={a.id} />

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-serif text-xl font-bold">{t("article.readAlso")}</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {related.map((r) => <ArticleCard key={r.id} a={r} variant="S" />)}
              </div>
            </section>
          )}

          {byAuthor.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-serif text-xl font-bold">{t("article.moreFromAuthor")}: {a.authorName}</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {byAuthor.map((r) => <ArticleCard key={r.id} a={r} variant="S" />)}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="sticky top-20 space-y-5">
            <AdSlot zone="mpu" />
            <div className="card p-4">
              <h3 className="mb-3 font-semibold">{t("home.mostRead")}</h3>
              <ol className="space-y-3">
                {popular.slice(0, 5).map((r, i) => (
                  <li key={r.id} className="flex gap-3 text-sm">
                    <span className="font-serif text-xl font-bold text-black/20 dark:text-white/20">{i + 1}</span>
                    <Link href={`/article/${r.slug}`} className="hover:text-brand dark:hover:text-white">{r.title}</Link>
                  </li>
                ))}
              </ol>
            </div>
            <AdSlot native />
          </div>
        </aside>
      </div>

      {/* infinite article-to-article scroll */}
      <InfiniteArticles queue={nextSlugs} />
    </div>
  );
}
