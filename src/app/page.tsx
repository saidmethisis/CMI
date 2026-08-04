import Link from "next/link";
import { listPublished, pinnedArticle, getCategories, localizeList, localizedArticle } from "@/lib/store";
import StoriesBar from "@/components/StoriesBar";
import RatesBoard from "@/components/RatesBoard";
import BankRates from "@/components/BankRates";
import { getBankRates } from "@/lib/bank-rates";
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
import { serverT, langAlternates } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

// Свой canonical: в корневом layout он намеренно не задан, иначе все страницы
// объявляли бы себя копией главной.
export async function generateMetadata() {
  return { alternates: await langAlternates("/") };
}

export default async function HomePage() {
  const { t, lang } = await serverT();

  // Главная не должна падать целиком, если база на секунду недоступна: раньше
  // любая ошибка Prisma превращала весь сайт в HTTP 500. Теперь шапка, меню,
  // курсы валют и футер остаются на месте, а лента просто пустая.
  const soft = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch (e) {
      console.error("Главная: не удалось получить данные —", (e as Error).message);
      return fallback;
    }
  };

  const categories = await soft(getCategories, []);
  // курсы банков тянем на сервере (кэш 1 час) — блок виден сразу, без «прыжка» после гидрации
  const bankRates = await soft(getBankRates, { data: {}, updatedAt: "", source: "unavailable" });
  const pinnedRaw = await soft(pinnedArticle, undefined);
  // тексты — на языке интерфейса, с фолбэком на язык оригинала
  const pinned = pinnedRaw ? { ...pinnedRaw, ...localizedArticle(pinnedRaw, lang) } : pinnedRaw;
  const all = localizeList(await soft(listPublished, []), lang);
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

      {/* Официальный курс ЦБ — компактной строкой сразу под срочными новостями.
          Таблица банков стоит ниже, прямо над лентой (см. основную колонку). */}
      <div className="container-content pt-4">
        <RatesBoard />
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
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black/[0.06] dark:bg-white/[0.08]">
                  {/* Без обложки — нейтральная заглушка: пустой src даёт значок
                      «битая картинка» в самом заметном блоке главной. */}
                  {pinned.cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={pinned.cover} alt={pinned.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-serif text-6xl font-bold text-black/15 dark:text-white/15">A</span>
                  )}
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

          {/* Курсы валют в банках — прямо над лентой, под ними начинается лента */}
          <div className="mb-8"><BankRates initial={bankRates} /></div>

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
