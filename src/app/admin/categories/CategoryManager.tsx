"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import CatMark from "@/components/CatMark";
import { useTaxonomy } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";

const palette = ["#14314f", "#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#c2410c", "#db2777", "#ca8a04", "#C81E3A"];

export default function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const { refresh } = useTaxonomy();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameUz, setNameUz] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // inline-редактирование существующей категории
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eNameUz, setENameUz] = useState("");
  const [eNameEn, setENameEn] = useState("");
  const [eColor, setEColor] = useState(palette[0]);

  const startEdit = (c: Category) => { setEditSlug(c.slug); setEName(c.name); setENameUz(c.nameUz || ""); setENameEn(c.nameEn || ""); setEColor(c.color || palette[0]); };
  const saveEdit = async () => {
    if (!editSlug) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: editSlug, name: eName, nameUz: eNameUz, nameEn: eNameEn, color: eColor }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Ошибка");
      setEditSlug(null); await refresh(); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (c: Category) => {
    if (!confirm(`Скрыть категорию «${c.name}»? Она исчезнет из меню и фильтров.`)) return;
    const r = await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: c.slug }) });
    const j = await r.json();
    if (!r.ok) { setError(j.error?.message || "Ошибка"); return; }
    await refresh(); router.refresh();
  };

  const add = async () => {
    setError("");
    if (!name.trim()) { setError("Введите название."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameUz, nameEn, color }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Ошибка");
      setName(""); setNameUz(""); setNameEn(""); setOpen(false);
      await refresh();       // update header/footer/menus everywhere
      router.refresh();      // update this admin list
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      {error && !open && <div className="mb-3 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{error}</div>}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{t("a.hCategories")}</h2>
        <button className="btn-primary text-xs" onClick={() => setOpen((v) => !v)}>＋ {t("a.create")}</button>
      </div>

      {open && (
        <div className="mb-4 rounded-xl border border-black/10 p-3 dark:border-white/10">
          {error && <div className="mb-2 text-xs text-down">{error}</div>}
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" placeholder="Название (RU)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Nomi (UZ)" value={nameUz} onChange={(e) => setNameUz(e.target.value)} />
            <input className="input" placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-black/50 dark:text-white/50">{t("a.color")}:</span>
            {palette.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-md ${color === c ? "ring-2 ring-offset-1 ring-black/40 dark:ring-white/40" : ""}`} style={{ background: c }} aria-label={c} />
            ))}
            <button className="btn-primary ml-auto text-xs" disabled={busy} onClick={add}>{busy ? "…" : t("a.save")}</button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {categories.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-center gap-3 py-3">
            <CatMark cat={c} size={36} className="!rounded-lg" />
            {editSlug === c.slug ? (
              <div className="flex-1">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="input" placeholder="Название (RU)" value={eName} onChange={(e) => setEName(e.target.value)} />
                  <input className="input" placeholder="Nomi (UZ)" value={eNameUz} onChange={(e) => setENameUz(e.target.value)} />
                  <input className="input" placeholder="Name (EN)" value={eNameEn} onChange={(e) => setENameEn(e.target.value)} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {palette.map((p) => (
                    <button key={p} onClick={() => setEColor(p)} className={`h-5 w-5 rounded-md ${eColor === p ? "ring-2 ring-offset-1 ring-black/40 dark:ring-white/40" : ""}`} style={{ background: p }} aria-label={p} />
                  ))}
                  <button className="btn-ghost ml-auto text-xs" onClick={() => setEditSlug(null)}>{t("a.cancel")}</button>
                  <button className="btn-primary text-xs" disabled={busy} onClick={saveEdit}>{t("a.save")}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-black/40 dark:text-white/40">/{c.slug} · {counts[c.slug] ?? 0} мат.</div>
                </div>
                <button className="btn-ghost text-xs" onClick={() => startEdit(c)}>{t("a.edit")}</button>
                <button className="btn-ghost text-xs !text-down" onClick={() => del(c)}>{t("a.hide")}</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-black/40 dark:text-white/40">Новая категория сразу появляется в меню, футере и фильтрах.</p>
    </div>
  );
}
