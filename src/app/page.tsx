import Link from "next/link";
import { listPublished, pinnedArticle, getCategories, localizeList, localizedArticle, listBreaking } from "@/lib/store";
import StoriesBar from "@/components/StoriesBar";
import BankRates from "@/components/BankRates";
import StockBoard from "@/components/StockBoard";
import Cover from "@/components/Cover";
import CatalogTabs from "@/components/CatalogTabs";
import { getBankRates } from "@/lib/bank-rates";
import { getStockQuotes } from "@/lib/stock";
import { publicCompanies, publicAuthors } from "@/lib/rbac-store";
import VideoHero from "@/components/VideoHero";
import FeedWithChips from "@/components/FeedWithChips";
import AdSlot from "@/components/AdSlot";
import BreakingNews from "@/components/BreakingNews";
import SaveButton from "@/components/SaveButton";
import NewsTimeline from "@/components/NewsTimeline";
import WeatherCard from "@/components/WeatherCard";
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
  const stock = await soft(getStockQuotes, { data: [], updatedAt: "", source: "unavailable" });
  // Каталоги для вкладок «Компании» и «Авторы» — критичное добавление из ТЗ:
  // со сводного экрана должен быть вход и в бизнес-каталог, и к авторам.
  const companies = await soft(publicCompanies, []);
  const authors = await soft(publicAuthors, []);
  const pinnedRaw = await soft(pinnedArticle, undefined);
  // тексты — на языке интерфейса, с фолбэком на язык оригинала
  const pinned = pinnedRaw ? { ...pinnedRaw, ...localizedArticle(pinnedRaw, lang) } : pinnedRaw;
  const all = localizeList(await soft(listPublished, []), lang);
  // separate video-first articles from photo-first articles
  const videos = all.filter((a) => a.videoUrl && a.slug !== pinned?.slug).slice(0, 6);
  const feed = all.filter((a) => !a.videoUrl && a.slug !== pinned?.slug);
  // Срочные — только отмеченные редакцией. Пусто → полоса не рисуется:
  // выдавать за срочное десять последних публикаций значит обесценить её.
  const breakingRaw = localizeList(await soft(() => listBreaking(10), []), lang);
  const breaking = breakingRaw.map((a) => ({ slug: a.slug, title: a.title }));
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

      {/* Растяжка сразу под разделами — первый экран, самое дорогое место.
          Ниже по странице остаются нативный блок в правой колонке и врезки
          внутри статей: так реклама не толкает контент вниз бесконечно. */}
      <div className="container-content pt-4">
        <AdSlot zone="leaderboard" />
      </div>

      <div className="container-content py-4">
        <StoriesBar />
      </div>

      {/* vaqt.uz-style left rail + Fox-style main + market rail */}
      <div className="container-content mt-6 grid gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[260px_1fr_300px]">
        {/* left chronological rail — independent scroll, then continues the page */}
        <aside className="hidden xl:block">
          <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-auto">
            <NewsTimeline items={timeline} urgent={breakingRaw.map((a) => ({ slug: a.slug, title: a.title, createdAt: a.createdAt }))} />
          </div>
        </aside>

        <div className="min-w-0">
          {pinned && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">Asosiy Aktiv</span>
              </div>
              <Link href={`/n/${pinned.slug}`} className="group block">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black/[0.06] dark:bg-white/[0.08]">
                  {/* Без обложки — нейтральная заглушка: пустой src даёт значок
                      «битая картинка» в самом заметном блоке главной. */}
                  {pinned.cover ? (
                    // Главная картинка первого экрана — грузим без ожидания прокрутки.
                    <Cover src={pinned.cover} alt={pinned.title} width={1600} height={900} sizes="(max-width: 1024px) 100vw, 720px" priority className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-serif text-6xl font-bold text-black/15 dark:text-white/15">A</span>
                  )}
                </div>
                <span className="mt-3 inline-block text-xs font-bold uppercase" style={{ color: pinnedCat?.color }}>{pinnedCat ? localizeName(lang, pinnedCat) : ""}</span>
                <h1 className="mt-1 font-serif text-3xl font-extrabold leading-tight group-hover:text-accent md:text-4xl">{pinned.title}</h1>
                <p className="mt-2 text-lg text-black/60 dark:text-white/70">{pinned.lead}</p>
              </Link>
              <div className="mt-3 flex items-center gap-3 text-sm text-black/60 dark:text-white/65">
                <span>{pinned.authorName}</span><span>· {pinned.readingMinutes} {t("common.min")}</span>
                <SaveButton slug={pinned.slug} className="ml-auto" />
              </div>
            </section>
          )}

          {/* SPECIAL REPORTS carousel */}
          <div className="mb-8"><SpecialReports items={special} /></div>

          {/* TRENDING NOW */}
          <div className="mb-8"><TrendingNow items={trending} /></div>

          {/* Компании и авторы площадки */}
          <div className="mb-8"><CatalogTabs companies={companies} authors={authors} /></div>

          {/* Asosiy Aktiv TV — крупный видео-блок. Название бренда не переводится. */}
          <div className="mb-8">
            <VideoHero items={videos} title="Asosiy Aktiv TV" moreLabel={t("tv.more")} />
          </div>

          {/* Курсы валют в банках — прямо над лентой, под ними начинается лента */}
          <div className="mb-8"><BankRates initial={bankRates} /></div>

          <h2 className="mb-4 border-b-2 border-brand pb-1 font-serif text-2xl font-extrabold"><T k="home.feed" /></h2>
          <FeedWithChips items={feed} />
        </div>

        {/* right rail: weather + market futures + native ad + most popular (independent scroll) */}
        <aside className="space-y-6">
          <div className="no-scrollbar space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-auto">
            <StockBoard initial={stock} compact />
            <WeatherCard />
            <CryptoTable />
            <AdSlot native />
            <div>
              <h3 className="mb-3 border-b-2 border-brand pb-1 font-serif text-lg font-bold"><T k="home.mostRead" /></h3>
              <ol className="space-y-3">
                {byViews.slice(0, 6).map((a, i) => (
                  <li key={a.id} className="flex gap-3 border-b border-black/5 pb-3 text-sm dark:border-white/10">
                    <span className="font-serif text-xl font-bold text-accent">{i + 1}</span>
                    <Link href={`/n/${a.slug}`} className="font-semibold leading-snug hover:text-accent">{a.title}</Link>
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
