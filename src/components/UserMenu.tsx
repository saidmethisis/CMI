"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useI18n } from "@/lib/i18n";
import ThemeToggle from "./ThemeToggle";
import LangSwitcher from "./LangSwitcher";

// Единое меню пользователя в шапке: быстрый вход в свой кабинет, профиль,
// разделы сайта, тема/язык и выход. Заменяет разрозненные ссылки.
export default function UserMenu() {
  const { user, role, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link href="/login" className="rounded-md border border-white/30 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/10">{t("auth.signin")}</Link>
        <Link href="/register" className="rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-brand hover:brightness-95">{t("auth.register")}</Link>
      </div>
    );
  }

  const s = user.roleSlug;
  const cabinet =
    s === "superadmin" ? { href: "/admin", label: t("menu.admin") }
    : s === "company" || user.companyId ? { href: "/company", label: t("menu.cabCompany") }
    : s === "writer" ? { href: "/author-panel", label: t("menu.cabAuthor") }
    : null;

  const name = user.displayName || user.name;
  const item = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/75 hover:bg-black/[0.05] dark:text-white/80 dark:hover:bg-white/[0.07]";

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex max-w-[170px] items-center gap-1.5 rounded-md border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10">
        <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-[10px] text-brand">
          {user.avatar ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : name.charAt(0)}
        </span>
        <span className="truncate">{name}</span>
        <span className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-black/10 bg-[var(--surface)] py-1.5 text-black shadow-xl dark:border-white/10 dark:bg-ink-surface dark:text-white" onClick={() => setOpen(false)}>
          <div className="border-b border-black/5 px-3 pb-2.5 pt-1 dark:border-white/10">
            <div className="text-[11px] text-black/45 dark:text-white/45">{t("menu.signedInAs")}</div>
            <div className="truncate text-sm font-bold">{name}</div>
            <div className="truncate text-xs text-black/50 dark:text-white/50">{role?.name ?? user.email}</div>
          </div>

          <div className="p-1">
            {cabinet && (
              <Link href={cabinet.href} className="mb-0.5 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/15">
                {cabinet.label} <span className="ml-auto text-xs opacity-60">→</span>
              </Link>
            )}
            <Link href="/account" className={item}>{t("menu.account")}</Link>
            <Link href="/topics" className={item}>{t("menu.allTopics")}</Link>
            <Link href="/notifications" className={item}>{t("nav.notifications")}</Link>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-black/5 px-3 py-2 dark:border-white/10">
            <span className="text-xs text-black/50 dark:text-white/50">{t("menu.appearance")}</span>
            <div className="flex items-center gap-1.5"><LangSwitcher /><ThemeToggle /></div>
          </div>

          <div className="border-t border-black/5 p-1 dark:border-white/10">
            <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-down hover:bg-down/5">{t("menu.logout")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
