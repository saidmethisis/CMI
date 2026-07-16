import Link from "next/link";
import { listPublished, pinnedArticle, getCategories } from "@/lib/store";
import StoriesBar from "@/components/StoriesBar";
import VideoRow from "@/components/VideoRow";
import FeedWithChips from "@/components/FeedWithChips";
import AdSlot from "@/components/AdSlot";
import BreakingNews from "@/components/BreakingNews";
import SaveButton from "@/components/SaveButton";
import NewsTimeline from "@/components/NewsTimeline";
import WeatherCard from "@/components/WeatherCard";
import CurrencyWidget from "@/components/CurrencyWidget";
import CryptoTable from "@/components/CryptoTable";
import SpecialReports from "@/components/SpecialReports";
import TrendingNow from "@/components/TrendingNow";
import T from "@/components/T";
import { serverT } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { t, lang } = await serverT();
  const categories = await getCategories();
  const pinned = await pinnedArticle();
  const all = await listPublished();
  // separate video-first articles from photo-first articles
  const videos = all.filter((a) => a.videoUrl && a.slug !== pinned?.slug).slice(0, 6);
  const feed = all.filter((a) => !a.videoUrl && a.slug !== pinned?.slug);
  const breaking = all.slice(0, 10).map((a) => ({ slug: a.slug, title: a.title }));
  const timeline = all.map((a) => ({ slug: a.slug, title: a.title, createdAt: a.createdAt }));
  const byViews = [...all].sort((a, b) => b.views - a.views);
  const special = byViews.slice(0, 6).map((a) => ({ slug: a.slug, title: a.title, cover: a.cover, author: a.company ?? a.authorName }));
  const trending = byViews.slice(0, 5).map((a) => ({ slug: a.slug, title: a.title }));
  const pinnedCat = categories.find((c) => c.slug === pinned?.categorySlug);

  return (
    <>
      <div className="container-content pt-4">
        <BreakingNews items={breaking} />
      </div>

      <div className="container-content py-4">
        <StoriesBar />
      </div>

      <div className="container-content">
        <AdSlot zone="leaderboard" />
      </div>

      {/* vaqt.uz-style left rail + Fox-style main + market rail */}
      <div className="container-content mt-6 grid gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[260px_1fr_300px]">
        {/* left chronological rail — independent scroll, then continues the page */}
        <aside className="hidden xl:block">
          <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-auto">
            <NewsTimeline items={timeline} />
          </div>
        </aside>

        <div className="min-w-0">
          {pinned && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">Asosiy Aktiv</span>
              </div>
              <Link href={`/article/${pinned.slug}`} className="group block">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pinned.cover} alt={pinned.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                </div>
                <span className="mt-3 inline-block text-xs font-bold uppercase" style={{ color: pinnedCat?.color }}>{pinnedCat ? localizeName(lang, pinnedCat) : ""}</span>
                <h1 className="mt-1 font-serif text-3xl font-extrabold leading-tight group-hover:text-accent md:text-4xl">{pinned.title}</h1>
                <p className="mt-2 text-lg text-black/60 dark:text-white/70">{pinned.lead}</p>
              </Link>
              <div className="mt-3 flex items-center gap-3 text-sm text-black/50 dark:text-white/50">
                <span>{pinned.authorName}</span><span>· {pinned.readingMinutes} {t("common.min")}</span>
                <SaveButton slug={pinned.slug} className="ml-auto" />
              </div>
            </section>
          )}

          {/* SPECIAL REPORTS carousel */}
          <div className="mb-8"><SpecialReports items={special} /></div>

          {/* TRENDING NOW */}
          <div className="mb-8"><TrendingNow items={trending} /></div>

          <div className="mb-8">
            <VideoRow title={<T k="home.video" />} items={videos} />
          </div>

          <h2 className="mb-4 border-b-2 border-brand pb-1 font-serif text-2xl font-extrabold"><T k="home.feed" /></h2>
          <FeedWithChips items={feed} />
        </div>

        {/* right rail: weather + market futures + native ad + most popular (independent scroll) */}
        <aside className="space-y-6">
          <div className="no-scrollbar space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-auto">
            <CurrencyWidget />
            <WeatherCard />
            <CryptoTable />
            <AdSlot native />
            <div>
              <h3 className="mb-3 border-b-2 border-brand pb-1 font-serif text-lg font-bold"><T k="home.mostRead" /></h3>
              <ol className="space-y-3">
                {byViews.slice(0, 6).map((a, i) => (
                  <li key={a.id} className="flex gap-3 border-b border-black/5 pb-3 text-sm dark:border-white/10">
                    <span className="font-serif text-xl font-bold text-accent">{i + 1}</span>
                    <Link href={`/article/${a.slug}`} className="font-semibold leading-snug hover:text-accent">{a.title}</Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
