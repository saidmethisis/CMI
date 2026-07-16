"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Req = { id: string; client: string; topic: string; status: string; createdAt: string };

const STATUS_KEYS = ["new", "processing", "done", "rejected"] as const;
const TONE: Record<string, string> = {
  new: "bg-accent/12 text-accent", processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  done: "bg-up/12 text-up", rejected: "bg-down/12 text-down",
};
const th = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40";
const td = "px-3 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06]";

export default function CompanyRequests({ companyId }: { companyId: string }) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const STATUSES: [string, string][] = STATUS_KEYS.map((k) => [k, t(`crq.${k}`)]);
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/company/requests?companyId=${encodeURIComponent(companyId)}`, { cache: "no-store" });
        const j = await r.json();
        if (alive && r.ok) setRows(j.data);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [companyId]);

  const setStatus = async (id: string, status: string) => {
    const prev = rows;
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r))); // оптимистично
    const r = await fetch("/api/company/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!r.ok) { setRows(prev); const j = await r.json(); alert(j.error?.message || t("crq.saveErr")); }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "long" });

  if (loading) return <p className="text-sm text-black/40 dark:text-white/40">{t("crq.loading")}</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        {[["all", t("crq.all")] as [string, string], ...STATUSES].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 font-medium transition ${filter === k ? "bg-brand text-white" : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white/60"}`}>
            {label}{counts[k] ? ` · ${counts[k]}` : ""}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={th}>{t("crq.client")}</th><th className={th}>{t("crq.topic")}</th><th className={th}>{t("crq.date")}</th><th className={th}>{t("crq.status")}</th><th className={`${th} text-right`}>{t("crq.action")}</th></tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-black/40 dark:text-white/40">{t("crq.empty")}</td></tr>}
            {shown.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-medium`}>{r.client}</td>
                <td className={td}>{r.topic}</td>
                <td className={`${td} whitespace-nowrap text-black/55 dark:text-white/55`}>{fmtDate(r.createdAt)}</td>
                <td className={td}><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[r.status]}`}>{STATUSES.find((s) => s[0] === r.status)?.[1]}</span></td>
                <td className={`${td} text-right`}>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}
                    className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/15">
                    {STATUSES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
