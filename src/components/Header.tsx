"use client";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import LangSwitcher from "./LangSwitcher";
import HeaderWeather from "./HeaderWeather";
import UserMenu from "./UserMenu";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { subsectionsFor } from "@/lib/nav";

export default function Header() {
  const [hover, setHover] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const subsections = subsectionsFor(lang);
  const { categories } = useTaxonomy();
  const catName = useCatName();
  // Подрубрики той рубрики, на которой сейчас курсор.
  const hoverSubs = (hover && subsections[hover]) || [];

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white shadow-md" onMouseLeave={() => setHover(null)}>
      {/* top row: logo + utilities */}
      <div className="container-content flex h-14 items-center gap-2 lg:gap-3">
        {/* Название издания — узбекской латиницей и всегда одинаковое: это имя
            бренда, а не переводимая надпись. Раньше слева был квадрат с буквой
            «A» — имитация значка, которого нет. */}
        <Link href="/" className="shrink-0 font-serif text-lg font-extrabold uppercase leading-none tracking-tight text-white sm:text-xl">
          Asosiy Aktiv
        </Link>

        {/* compact weather — mobile only (desktop shows the full weather card in the rail) */}
        <HeaderWeather className="hidden min-[480px]:inline-flex md:hidden" />


        {/* Рубрики отдают место первыми: их семь, а справа стоят вещи, которые
            обрезать нельзя — переключатель языка, поиск, вход. Когда места не
            хватает, список прокручивается вбок.

            Подрубрики рисуются НЕ здесь, а строкой под шапкой: прокрутка
            обрезает всё, что выходит за её пределы, и выпадающий список
            оставался внутри полосы навигации, наполовину невидимый. */}
        <nav className="no-scrollbar ml-2 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex lg:ml-4">
          {categories.slice(0, 7).map((c) => {
            const subs = subsections[c.slug];
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                onMouseEnter={() => setHover(c.slug)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1.5 text-sm font-bold hover:text-white lg:px-2.5 ${
                  hover === c.slug ? "text-white" : "text-white/85"
                }`}
              >
                {catName(c)}
                {subs && <span className="text-[9px] opacity-60">▾</span>}
              </Link>
            );
          })}
        </nav>

        {/* Название канала не переводится — это бренд, как и само издание. */}
        <Link href="/video" className="hidden shrink-0 whitespace-nowrap rounded-lg bg-accent px-2.5 py-1.5 text-sm font-bold text-white hover:bg-accent-700 xl:inline-flex">
          Asosiy Aktiv TV
        </Link>

        {/* «Цифры» рядом с рубриками: на десктопе это единственный вход в
            дата-центр, где собраны все показатели разом. Подпись переводится. */}
        <Link href="/numbers" className="ml-1 hidden shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-sm font-bold text-white hover:bg-white/25 lg:inline-flex">
          {t("tabFull.numbers")}
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <LangSwitcher dark />
          <Link href="/search" className="hidden shrink-0 whitespace-nowrap rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10 sm:inline-flex">
            {t("nav.search")}
          </Link>
          <ThemeToggle onDark />
          <UserMenu />
        </div>
      </div>

      {/* Подрубрики выбранной рубрики — отдельной строкой под шапкой.
          Раньше это был выпадающий список внутри полосы навигации, но список
          рубрик прокручивается вбок, а прокрутка обрезает всё, что выходит за
          её пределы: меню было видно наполовину. Здесь оно вне прокрутки,
          показывается целиком и вмещает длинные названия.

          Полоса держится, пока курсор на рубрике или на ней самой; уводя мышь
          из шапки, читатель её закрывает. */}
      {hoverSubs.length > 0 && (
        <div className="hidden animate-slide-up border-t border-white/10 bg-brand-900 md:block">
          <div className="container-content flex flex-wrap items-center gap-1 py-2">
            {hoverSubs.map((s) => (
              <Link
                key={s}
                href={`/category/${hover}?sub=${encodeURIComponent(s)}`}
                onClick={() => setHover(null)}
                className="rounded-md px-2.5 py-1 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
