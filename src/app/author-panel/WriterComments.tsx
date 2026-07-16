"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type C = { id: string; author: string; body: string; status: string; createdAt: string; articleTitle: string; articleSlug: string };

const TONE: Record<string, string> = {
  approved: "bg-up/12 text-up", pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  spam: "bg-down/12 text-down", rejected: "bg-down/12 text-down",
};

export default function WriterComments() {
  const { t } = useI18n();
  const [rows, setRows] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/author/comments", { cache: "no-store" });
        const j = await r.json();
        if (alive && r.ok) setRows(j.data);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const statusLabel = (s: string) => s === "approved" ? "✓" : s === "pending" ? t("comments.pendingBadge") : s === "spam" ? t("wc.spam") : t("status.rejected");

  const moderate = async (id: string, status: string) => {
    const prev = rows;
    setRows((p) => p.map((c) => (c.id === id ? { ...c, status } : c)));
    const r = await fetch("/api/author/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!r.ok) { setRows(prev); const j = await r.json(); alert(j.error?.message || "Ошибка."); }
  };
  const del = async (id: string) => {
    if (!confirm(t("comments.confirmDelete"))) return;
    const prev = rows;
    setRows((p) => p.filter((c) => c.id !== id));
    const r = await fetch("/api/author/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!r.ok) { setRows(prev); const j = await r.json(); alert(j.error?.message || "Ошибка."); }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  if (loading) return <div className="card p-6 text-sm text-black/40 dark:text-white/40">…</div>;

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-serif text-lg font-bold">{t("wc.comments")}</h3>
      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        {[["all", t("wc.all")], ["pending", t("comments.pendingBadge")], ["approved", "✓"], ["spam", t("wc.spam")]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 font-medium transition ${filter === k ? "bg-brand text-white" : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white/60"}`}>
            {label}{counts[k] ? ` · ${counts[k]}` : ""}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">{t("wc.commentsEmpty")}</p>
      ) : (
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {shown.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 text-sm">
              <span className="font-medium">{c.author}</span>
              <span className="min-w-0 flex-1 truncate text-black/60 dark:text-white/60">{c.body}</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[c.status] ?? TONE.pending}`}>{statusLabel(c.status)}</span>
              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                <Link href={`/article/${c.articleSlug}#c-${c.id}`} className="btn-ghost text-xs">{t("wc.viewArticle")}</Link>
                {c.status !== "approved" && <button onClick={() => moderate(c.id, "approved")} className="btn-ghost text-xs !text-up">{t("wc.approve")}</button>}
                {c.status !== "spam" && <button onClick={() => moderate(c.id, "spam")} className="btn-ghost text-xs">{t("wc.spam")}</button>}
                <button onClick={() => del(c.id)} className="btn-ghost text-xs !text-down">{t("wc.del")}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
