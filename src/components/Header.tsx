"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import LangSwitcher from "./LangSwitcher";
import HeaderWeather from "./HeaderWeather";
import UserMenu from "./UserMenu";
import { useAuth } from "@/lib/useAuth";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { subsectionsFor } from "@/lib/nav";

// route the "Кабинет" button by the real logged-in role (4 roles)
function cabinetHref(user: { roleSlug: string; companyId: string | null } | null, roleSlug?: string): string {
  if (!user) return "/login";
  const s = roleSlug || user.roleSlug;
  if (s === "superadmin") return "/admin";
  if (s === "company" || user.companyId) return "/company";
  if (s === "writer") return "/author-panel";
  return "/account";
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const subsections = subsectionsFor(lang);
  const { user, role, logout } = useAuth();
  const { categories } = useTaxonomy();
  const catName = useCatName();

  const cabinet = cabinetHref(user, role?.slug);

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white shadow-md">
      {/* top row: logo + utilities */}
      <div className="container-content flex h-14 items-center gap-3">
        <button className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] text-white md:hidden" aria-label={t("a11y.menu")} onClick={() => setOpen((v) => !v)}>
          <span className="h-0.5 w-5 rounded bg-current" />
          <span className="h-0.5 w-5 rounded bg-current" />
          <span className="h-0.5 w-5 rounded bg-current" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-white font-serif text-lg font-bold text-brand">A</span>
          <span className="hidden font-serif text-lg font-extrabold uppercase leading-none tracking-tight text-white sm:block">Asosiy<br />Aktiv</span>
        </Link>

        {/* compact weather — mobile only (desktop shows the full weather card in the rail) */}
        <HeaderWeather className="hidden min-[400px]:inline-flex md:hidden" />


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

        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher dark className="hidden sm:inline-flex" />
          <Link href="/search" className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10">
            {t("nav.search")}
          </Link>
          <ThemeToggle onDark />
          <UserMenu />
          <Link href="/for-companies" className="whitespace-nowrap rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-white hover:brightness-110">{t("header.promo")}</Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-700 text-white md:hidden">
          <nav className="container-content grid gap-1 py-3">
            <div className="pb-2"><LangSwitcher dark /></div>
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{catName(c)}</Link>
            ))}
            <div className="mt-2 grid gap-1 border-t border-white/10 pt-2">
              {user ? (
                <>
                  {cabinet !== "/account" && <Link href={cabinet} onClick={() => setOpen(false)} className="rounded-lg bg-white/15 px-3 py-2 font-bold text-white hover:bg-white/20">{t("header.cabinet")} →</Link>}
                  <Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("menu.account")}</Link>
                  <Link href="/topics" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("menu.allTopics")}</Link>
                  <Link href="/notifications" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("nav.notifications")}</Link>
                  <Link href="/search" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("nav.search")}</Link>
                  <button onClick={() => { setOpen(false); logout(); }} className="rounded-lg px-3 py-2 text-left font-semibold text-white/70 hover:bg-white/10">{t("menu.logout")}</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg bg-white/15 px-3 py-2 font-bold text-white hover:bg-white/20">{t("auth.signin")}</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("auth.register")}</Link>
                  <Link href="/topics" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("menu.allTopics")}</Link>
                  <Link href="/search" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-white/90 hover:bg-white/10">{t("nav.search")}</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
