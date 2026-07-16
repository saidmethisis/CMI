"use client";
import { useState } from "react";
import type { AccreditationRequest } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export default function AccreditationList({ initial }: { initial: AccreditationRequest[] }) {
  const { t } = useI18n();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const setStatus = async (id: string, status: AccreditationRequest["status"]) => {
    setBusy(id); setMsg("");
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x))); // оптимистично
    try {
      const r = await fetch("/api/admin/accreditation", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error?.message); }
    } catch (e) {
      setRows(prev); // откат при ошибке
      setMsg((e as Error).message || "Ошибка сохранения."); setTimeout(() => setMsg(""), 3000);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {msg && <div className="mb-3 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{msg}</div>}
      <div className="card divide-y divide-black/5 dark:divide-white/10">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand dark:bg-white/10 dark:text-white">
            {r.type === "business" ? "Co" : "Au"}
          </span>
          <div className="flex-1">
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-black/50 dark:text-white/50">{r.type === "business" ? "Бизнес" : "Автор"} · {r.detail}</div>
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2">
              <button disabled={busy === r.id} onClick={() => setStatus(r.id, "blocked")} className="btn-ghost text-xs !text-down">{t("a.block")}</button>
              <button disabled={busy === r.id} onClick={() => setStatus(r.id, "approved")} className="btn-primary text-xs">{t("a.confirm")}</button>
            </div>
          ) : (
            <span className={`chip ${r.status === "approved" ? "!border-up/40 text-up" : "!border-down/40 text-down"}`}>
              {r.status === "approved" ? `✓ ${t("a.verified")}` : t("status.rejected")}
            </span>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
