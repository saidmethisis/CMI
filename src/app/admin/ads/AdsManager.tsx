"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { AdBanner } from "@/lib/types";

const slotLabel: Record<string, string> = { top: "Top Banner", "in-article": "In-Article", sidebar: "Sidebar" };

export default function AdsManager({ initial }: { initial: AdBanner[] }) {
  const { t } = useI18n();
  const [ads, setAds] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [nf, setNf] = useState({ title: "", slot: "top" });
  const [msg, setMsg] = useState("");
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const patch = async (id: string, body: { active?: boolean; frequency?: number }) => {
    const r = await fetch("/api/admin/ads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    if (!r.ok) { const j = await r.json(); flash(j.error?.message || "Ошибка сохранения."); return false; }
    return true;
  };
  const toggle = async (id: string) => {
    const cur = ads.find((x) => x.id === id); if (!cur) return;
    const next = !cur.active;
    setAds((a) => a.map((x) => (x.id === id ? { ...x, active: next } : x)));
    if (!(await patch(id, { active: next }))) setAds((a) => a.map((x) => (x.id === id ? { ...x, active: cur.active } : x)));
  };
  const setFreq = async (id: string, f: number) => {
    setAds((a) => a.map((x) => (x.id === id ? { ...x, frequency: f } : x)));
    await patch(id, { frequency: f });
  };
  const create = async () => {
    if (!nf.title.trim()) return;
    const r = await fetch("/api/admin/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) });
    const j = await r.json();
    if (!r.ok) { flash(j.error?.message || "Ошибка"); return; }
    setAds((a) => [...a, j.data]); setNf({ title: "", slot: "top" }); setCreating(false);
  };

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{msg}</div>}
      <div className="grid grid-cols-3 gap-3">
        {(["top", "in-article", "sidebar"] as const).map((s) => (
          <div key={s} className="card p-4 text-center">
            <div className="text-xs text-black/50 dark:text-white/50">{slotLabel[s]}</div>
            <div className="text-2xl font-bold">{ads.filter((a) => a.slot === s && a.active).length}</div>
            <div className="text-xs text-black/40">активных</div>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-black/5 dark:divide-white/10">
        {ads.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-black/50 dark:text-white/50">{slotLabel[a.slot]} · {a.impressions.toLocaleString("ru-RU")} показов</div>
            </div>
            <label className="flex items-center gap-1.5 text-xs">
              Частота
              <input type="number" min={1} max={20} value={a.frequency} onChange={(e) => setFreq(a.id, +e.target.value)}
                className="w-16 rounded-lg border border-black/10 bg-transparent px-2 py-1 dark:border-white/15" />
            </label>
            <button onClick={() => toggle(a.id)} className={`h-6 w-11 rounded-full p-0.5 transition ${a.active ? "bg-up" : "bg-black/20"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white transition ${a.active ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
      </div>
      <div>
        <button className="btn-primary text-sm" onClick={() => setCreating((v) => !v)}>+ {t("a.uploadBanner")}</button>
        {creating && (
          <div className="card mt-2 flex flex-wrap items-center gap-2 p-3">
            <input className="input min-w-0 flex-1" placeholder="Название баннера" value={nf.title} autoFocus onChange={(e) => setNf({ ...nf, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && create()} />
            <select className="input w-40" value={nf.slot} onChange={(e) => setNf({ ...nf, slot: e.target.value })}>
              {(["top", "in-article", "sidebar"] as const).map((s) => <option key={s} value={s}>{slotLabel[s]}</option>)}
            </select>
            <button className="btn-primary shrink-0" onClick={create}>{t("a.create")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
