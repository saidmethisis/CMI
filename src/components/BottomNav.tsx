"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";

const items = [
  { href: "/", key: "nav.home" },
  { href: "/topics", key: "nav.topics" },
  { href: "/notifications", key: "nav.notifications" },
  { href: "/account", key: "nav.profile" },
];

export default function BottomNav() {
  const path = usePathname();
  const { t } = useI18n();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let alive = true;
    const load = async () => {
      try { const r = await fetch("/api/notifications", { cache: "no-store" }); const j = await r.json(); if (alive) setUnread(j.unread ?? 0); } catch { /* */ }
    };
    load();
    const id = setInterval(load, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [user, path]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black/10 bg-[var(--surface)] shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)] md:hidden dark:border-white/15 dark:bg-ink-surface dark:shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          const showBadge = it.href === "/notifications" && unread > 0;
          return (
            <Link key={it.href} href={it.href} className={`relative flex items-center justify-center py-3.5 text-[13px] font-bold ${active ? "text-accent" : "text-black/70 dark:text-white/70"}`}>
              {active && <span className="absolute inset-x-3 top-0 h-1 rounded-b bg-accent" />}
              {active && <span className="absolute inset-x-2 inset-y-1.5 -z-10 rounded-xl bg-accent/10" />}
              {t(it.key)}
              {showBadge && (
                <span className="absolute right-[calc(50%-38px)] top-1.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-[var(--surface)] dark:ring-ink-surface">{unread > 9 ? "9+" : unread}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
