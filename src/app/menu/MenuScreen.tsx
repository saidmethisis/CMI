"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import LangSwitcher from "@/components/LangSwitcher";

// Раздел «Меню» — пятая кнопка нижней панели.
//
// Сюда переехало всё, что жило в гамбургере, плюс «Моя страница». После того
// как гамбургер убрали из шапки, вход в кабинеты, рубрики и правовые страницы
// на телефоне остался бы только через адресную строку.
//
// Кабинет открывается по роли: суперадмину — админка, компании — её кабинет,
// автору — панель автора, читателю — личная страница.
function cabinetHref(user: { roleSlug: string; companyId: string | null } | null, roleSlug?: string): string {
  if (!user) return "/login";
  const s = roleSlug || user.roleSlug;
  if (s === "superadmin") return "/admin";
  if (s === "company" || user.companyId) return "/company";
  if (s === "writer") return "/author-panel";
  return "/account";
}

export default function MenuScreen() {
  const { t } = useI18n();
  const { user, role, logout } = useAuth();
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const cabinet = cabinetHref(user, role?.slug);

  const Row = ({ href, label, hint }: { href: string; label: string; hint?: string }) => (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
      <span className="flex-1 font-semibold">{label}</span>
      {hint && <span className="text-xs text-black/50 dark:text-white/50">{hint}</span>}
      <span aria-hidden className="text-black/30 dark:text-white/30">›</span>
    </Link>
  );

  return (
    <div className="container-content max-w-2xl py-6">
      <h1 className="mb-5 font-serif text-3xl font-bold">{t("tabFull.menu")}</h1>

      {/* Моя страница — по заданию живёт здесь */}
      <section className="card mb-4 divide-y divide-black/5 p-1 dark:divide-white/10">
        <Row href="/account" label={t("tabFull.my")} hint={user ? user.displayName || user.name : undefined} />
        <Row href="/notifications" label={t("nav.notifications")} />
        {user && cabinet !== "/account" && <Row href={cabinet} label={t("header.cabinet")} />}
      </section>

      {/* Разделы площадки */}
      <section className="card mb-4 divide-y divide-black/5 p-1 dark:divide-white/10">
        <Row href="/feed" label={t("tabFull.feed")} />
        <Row href="/video" label={t("vid.title")} />
        <Row href="/numbers" label={t("tabFull.numbers")} />
        <Row href="/companies" label={t("co.title")} />
        <Row href="/authors" label={t("au.title")} />
        <Row href="/search" label={t("nav.search")} />
      </section>

      {/* Рубрики — то, ради чего в шапке раньше был гамбургер */}
      {categories.length > 0 && (
        <section className="card mb-4 p-4">
          <h2 className="mb-3 font-semibold">{t("menu.allTopics")}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="chip hover:bg-black/5 dark:hover:bg-white/10">
                <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: c.color }} />
                {catName(c)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Язык и оформление */}
      <section className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <span className="font-semibold">{t("menu.language")}</span>
        <LangSwitcher />
      </section>

      {/* Правовое и вход */}
      <section className="card divide-y divide-black/5 p-1 dark:divide-white/10">
        <Row href="/legal" label={t("footer.imprint")} />
        <Row href="/privacy" label={t("footer.privacy")} />
        <Row href="/terms" label={t("footer.terms")} />
        {user ? (
          <button onClick={logout} className="flex w-full items-center rounded-xl px-4 py-3 text-left font-semibold text-black/60 hover:bg-black/[0.04] dark:text-white/60 dark:hover:bg-white/[0.06]">
            {t("menu.logout")}
          </button>
        ) : (
          <>
            <Row href="/login" label={t("auth.signin")} />
            <Row href="/register" label={t("auth.register")} />
          </>
        )}
      </section>
    </div>
  );
}
