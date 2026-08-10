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

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white shadow-md">
      {/* top row: logo + utilities */}
      <div className="container-content flex h-14 items-center gap-3">
        {/* Название издания — узбекской латиницей и всегда одинаковое: это имя
            бренда, а не переводимая надпись. Раньше слева был квадрат с буквой
            «A» — имитация значка, которого нет. */}
        <Link href="/" className="shrink-0 font-serif text-lg font-extrabold uppercase leading-none tracking-tight text-white sm:text-xl">
          Asosiy Aktiv
        </Link>

        {/* compact weather — mobile only (desktop shows the full weather card in the rail) */}
        <HeaderWeather className="hidden min-[480px]:inline-flex md:hidden" />


        {/* desktop nav with mega-menu */}
        <nav className="ml-4 hidden items-center gap-0.5 md:flex" onMouseLeave={() => setHover(null)}>
          {categories.slice(0, 7).map((c) => {
            const subs = subsections[c.slug];
            return (
              <div key={c.slug} className="relative" onMouseEnter={() => setHover(c.slug)}>
                <Link href={`/category/${c.slug}`} className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-bold text-white/85 hover:text-white">
                  {catName(c)}
                  {subs && <span className="text-[9px] opacity-60">▾</span>}
                </Link>
                {subs && hover === c.slug && (
                  <div className="absolute left-0 top-full z-50 w-56 animate-slide-up rounded-b-lg border border-t-0 border-black/10 bg-[var(--surface)] p-2 shadow-xl dark:border-white/10 dark:bg-ink-surface">
                    {subs.map((s) => (
                      <Link key={s} href={`/category/${c.slug}?sub=${encodeURIComponent(s)}`} onClick={() => setHover(null)} className="block rounded px-3 py-2 text-sm font-semibold text-brand hover:bg-black/[0.04] hover:text-accent dark:text-white/80 dark:hover:bg-white/10">{s}</Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* «Цифры» рядом с рубриками: на десктопе это единственный вход в
            дата-центр, где собраны все показатели разом. Подпись переводится. */}
        <Link href="/numbers" className="ml-2 hidden shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/25 md:inline-flex">
          {t("tabFull.numbers")}
        </Link>

        {/* Название канала не переводится — это бренд, как и само издание. */}
        <Link href="/video" className="hidden shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white hover:bg-accent-700 md:inline-flex">
          Asosiy Aktiv TV
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher dark />
          <Link href="/search" className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10">
            {t("nav.search")}
          </Link>
          <ThemeToggle onDark />
          <UserMenu />
        </div>
      </div>

    </header>
  );
}
