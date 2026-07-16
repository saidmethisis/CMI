"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type N = { id: string; title: string; body: string; link: string; read: boolean; createdAt: string };

export default function WriterNotifications() {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await fetch("/api/notifications", { cache: "no-store" });
    const j = await r.json();
    setItems(j.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const markAll = async () => { await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); load(); };

  if (loading) return <div className="card p-6 text-sm text-black/40 dark:text-white/40">{t("notif.loading")}</div>;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold">{t("wc.notifications")}</h3>
        {items.some((n) => !n.read) && <button onClick={markAll} className="btn-ghost text-xs">{t("notif.markAll")}</button>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">{t("notif.empty")}</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {items.map((n) => {
            const inner = (
              <div className={`flex items-start gap-3 py-3 ${!n.read ? "font-semibold" : ""}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-accent"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-sm font-normal text-black/55 dark:text-white/55">{n.body}</p>}
                  <p className="mt-1 text-xs font-normal text-black/40 dark:text-white/40">{new Date(n.createdAt).toLocaleString(loc)}</p>
                </div>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
