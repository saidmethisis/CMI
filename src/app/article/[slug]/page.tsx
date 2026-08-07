import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getArticle, listPublished, listPopular, getCategories, localizedArticle, localizeList, bumpViews } from "@/lib/store";
import { serverT, getLang, langAlternates } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import { getAuth } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { findAuthorByFullName } from "@/lib/rbac-store";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { htmlToText } from "@/lib/sanitize-html";
import ArticleView from "@/components/ArticleView";
import LeadMedia from "@/components/LeadMedia";
import Comments from "@/components/Comments";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import InfiniteArticles from "@/components/InfiniteArticles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

// Кому разрешено видеть неопубликованную статью: её автору и модератору (news.publish).
// Вынесено в отдельную функцию, потому что ту же проверку обязана делать и generateMetadata:
// она выполняется независимо от компонента страницы, и без проверки заголовок черновика
// утекал в <title> даже на 404-ответе постороннему.
async function mayPreview(a: { status: string; authorUserId?: string }) {
  if (a.status === "published") return true;
  const { user, perms } = await getAuth();
  return !!user && (a.authorUserId === user.id || can(perms, "news.publish"));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || !(await mayPreview(a))) return { title: "Не найдено" };
  const lang = await getLang();
  const L = localizedArticle(a, lang);
  // Обложку в карточку соцсети подставляем только если она есть: пустая строка в
  // og:image заставляла мессенджер показывать ссылку голым текстом. Без обложки
  // берём нарисованную карточку с заголовком (/og/article/…).
  const images = [a.cover || `${SITE_URL}/og/article/${a.slug}`];
  return {
    title: L.title,
    description: L.lead,
    openGraph: {
      title: L.title, description: L.lead, type: "article",
      publishedTime: new Date(a.createdAt).toISOString(),
      authors: [a.company ?? a.authorName],
      images,
    },
    twitter: { card: "summary_large_image", title: L.title, description: L.lead, images },
    alternates: await langAlternates(`/article/${a.slug}`),
  };
}

export default async function ArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const a = await getArticle(slug);
  if (!a) notFound();

  const isPreview = preview === "1";
  if (a.status !== "published") {
    if (!(await mayPreview(a))) notFound();
  } else if (!isPreview) {
    // Считаем просмотр только для реального публичного просмотра (не предпросмотра).
    // Ключ читателя — IP + User-Agent: он не идентифицирует человека, а лишь позволяет
    // не засчитывать повторные открытия одной и той же страницы подряд.
    const h = await headers();
    const viewerKey = `${h.get("x-forwarded-for") ?? "local"}|${(h.get("user-agent") ?? "").slice(0, 80)}`;
    await bumpViews(a.slug, viewerKey);
  }

  const { t, lang } = await serverT();
  const L = localizedArticle(a, lang);
  const localized = { ...a, title: L.title, lead: L.lead, body: L.body };
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === a.categorySlug);
  const catLabel = cat ? localizeName(lang, cat) : "";
  const all = localizeList(await listPublished(), lang);
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
  // «Самое читаемое» берём отдельным запросом с сортировкой в базе, а не
  // пересортировкой всего архива в памяти на каждый просмотр статьи.
  const popular = localizeList(await listPopular(5), lang);
  // queue for infinite article-to-article scroll (recent, excluding current)
  const nextSlugs = all.filter((x) => x.slug !== a.slug).slice(0, 8).map((x) => x.slug);

  // Автора ищем в справочнике, чтобы в разметке стояла ссылка на его профиль:
  // тогда поисковик связывает статью с человеком, у которого есть Person-страница,
  // а не с одинаковой строкой имени. Нет такого автора — обходимся именем.
  const authorRef = await findAuthorByFullName(a.authorName).catch(() => null);
  const articleUrl = `${SITE_URL}/article/${a.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
    headline: L.title.slice(0, 110), // Google обрезает headline длиннее 110 символов
    description: L.lead,
    ...(a.cover ? { image: [a.cover.startsWith("http") ? a.cover : `${SITE_URL}${a.cover}`] } : {}),
    datePublished: a.createdAt,
    dateModified: a.createdAt,
    inLanguage: lang,
    author: [
      authorRef
        ? { "@type": "Person", name: a.authorName, url: `${SITE_URL}/author/${authorRef.slug}`, "@id": `${SITE_URL}/author/${authorRef.slug}#person` }
        : { "@type": a.company ? "Organization" : "Person", name: a.company ?? a.authorName },
    ],
    publisher: { "@type": "NewsMediaOrganization", name: SITE_NAME, url: SITE_URL },
    articleSection: catLabel || cat?.name,
    ...(a.tags?.length ? { keywords: a.tags.join(", ") } : {}),
    isAccessibleForFree: true,
    wordCount: htmlToText(L.body).split(/\s+/).filter(Boolean).length,
  };

  return (
    <div className="container-content py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {a.status !== "published" && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <span className="font-semibold">{t("preview.badge")}</span>
          <span className="opacity-80">{t("preview.note")} · {t(`status.${a.status}`)}</span>
          <Link href="/author-panel" className="ml-auto btn-ghost text-xs">{t("preview.back")}</Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <nav className="mb-3 text-xs text-black/60 dark:text-white/65">
            <Link href="/">{t("article.home")}</Link> ›{" "}
            <Link href={`/category/${a.categorySlug}`}>{catLabel}</Link>
          </nav>

          <header className="mb-5">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cat?.color }}>{catLabel}</span>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">{L.title}</h1>
            {/* compact teaser / summary line */}
            <p className="mt-3 text-lg text-black/60 dark:text-white/70">{L.lead}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-black/5 py-3 text-sm dark:border-white/10">
              <div>
                <span className="font-semibold">{a.company ?? a.authorName}</span>
                <div className="text-xs text-black/60 dark:text-white/65">
                  {new Date(a.createdAt).toLocaleDateString(lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU", { day: "numeric", month: "long", year: "numeric" })} · {a.readingMinutes} {t("common.min")}
                  {a.authorKind === "pr" && ` · ${t("article.partner")}`}
                </div>
              </div>
            </div>
          </header>

          <LeadMedia cover={a.cover} videoUrl={a.videoUrl} title={L.title} noVideoLabel={t("ui.noVideo")} />

          <ArticleView a={localized} />

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
                {popular.map((r, i) => (
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
