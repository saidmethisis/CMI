"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useI18n } from "@/lib/i18n";

type N = { id: string; type: string; title: string; body: string; link: string; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/notifications", { cache: "no-store" });
    const j = await r.json();
    setItems(j.data ?? []); setUnread(j.unread ?? 0);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const markAll = async () => { await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); load(); };
  const markOne = async (id: string) => { await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load(); };

  if (loading) return <div className="container-content py-16 text-center text-black/40">{t("notif.loading")}</div>;
  if (!user) return (
    <div className="container-content grid min-h-[50vh] place-items-center py-10 text-center">
      <div><h1 className="font-serif text-2xl font-bold">{t("notifications.title")}</h1><p className="mt-2 text-black/60 dark:text-white/60">{t("notif.loginToSee")}</p><Link href="/login" className="btn-primary mt-4 inline-flex">{t("auth.signin")}</Link></div>
    </div>
  );

  return (
    <div className="container-content max-w-2xl py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">{t("notifications.title")} {unread > 0 && <span className="align-middle text-base text-accent">· {unread} {t("notif.new")}</span>}</h1>
        {unread > 0 && <button onClick={markAll} className="btn-ghost text-xs">{t("notif.markAll")}</button>}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-black/50 dark:text-white/50">{t("notif.empty")}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const inner = (
              <div className={`card flex items-start gap-3 p-4 ${!n.read ? "border-l-4 border-l-accent" : ""}`}>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-accent"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-black/55 dark:text-white/55">{n.body}</p>}
                  <p className="mt-1 text-xs text-black/40 dark:text-white/40">{new Date(n.createdAt).toLocaleString(loc)}</p>
                </div>
                {!n.read && <button onClick={(e) => { e.preventDefault(); markOne(n.id); }} className="shrink-0 text-xs text-brand dark:text-white">{t("notif.read")}</button>}
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link} onClick={() => !n.read && markOne(n.id)}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
