"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTHOR_CAPABILITIES } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n";

type Author = {
  id: string; slug: string; firstName: string; lastName: string; avatar: string; verifyStatus: string;
  companyId: string | null; capabilities: Record<string, boolean>; profile: Record<string, string>;
};
type Company = { id: string; name: string };

// Only the essential profile fields are shown. Rarely-used ones (отчество, награды,
// сертификаты, навыки, тематики, опыт, образование, телефон, LinkedIn и т.д.) убраны,
// чтобы форма не была перегруженной. Их данные в БД не удаляются.
const fields: { key: string; label: string }[] = [
  { key: "position", label: "Должность" },
  { key: "specialization", label: "Специализация" },
  { key: "city", label: "Город" },
  { key: "telegram", label: "Telegram" },
  { key: "instagram", label: "Instagram" },
  { key: "website", label: "Website" },
];

export default function AuthorsPage() {
  const { t } = useI18n();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sel, setSel] = useState<Author | null>(null);
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [nf, setNf] = useState({ firstName: "", lastName: "" });

  const load = async () => {
    const [a, c] = await Promise.all([fetch("/api/admin/authors", { cache: "no-store" }).then((r) => r.json()), fetch("/api/admin/companies", { cache: "no-store" }).then((r) => r.json())]);
    setAuthors(a.data); setCompanies(c.data);
    setSel((p) => (p ? a.data.find((x: Author) => x.id === p.id) ?? null : null));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    if (!nf.firstName.trim()) return;
    const r = await fetch("/api/admin/authors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) });
    const j = await r.json();
    if (r.ok) { setNf({ firstName: "", lastName: "" }); setCreating(false); await load(); setSel(j.data); } else setMsg(j.error?.message || "Ошибка");
  };
  const save = async () => {
    if (!sel) return;
    const r = await fetch("/api/admin/authors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sel) });
    setMsg(r.ok ? "Сохранено" : "Ошибка сохранения"); setTimeout(() => setMsg(""), 2000); if (r.ok) load();
  };
  const remove = async () => { if (!sel || !confirm("Удалить автора?")) return; await fetch("/api/admin/authors", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel.id }) }); setSel(null); load(); };

  const setProfile = (k: string, v: string) => setSel((s) => (s ? { ...s, profile: { ...s.profile, [k]: v } } : s));
  const setCap = (k: string, v: boolean) => setSel((s) => (s ? { ...s, capabilities: { ...s.capabilities, [k]: v } } : s));


  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">{t("a.hAuthors")}</h1><p className="text-sm text-black/50 dark:text-white/50">{t("a.hAuthorsSub")}</p></div>
        <button className="btn-primary text-sm" onClick={() => setCreating((v) => !v)}>+ {t("a.create")}</button>
      </div>
      {creating && (
        <div className="card mb-3 flex flex-wrap gap-2 p-3">
          <input className="input min-w-0 flex-1" placeholder={t("a.name")} value={nf.firstName} autoFocus onChange={(e) => setNf({ ...nf, firstName: e.target.value })} onKeyDown={(e) => e.key === "Enter" && create()} />
          <input className="input min-w-0 flex-1" placeholder={t("a.lastName")} value={nf.lastName} onChange={(e) => setNf({ ...nf, lastName: e.target.value })} onKeyDown={(e) => e.key === "Enter" && create()} />
          <button className="btn-primary shrink-0" onClick={create}>{t("a.create")}</button>
        </div>
      )}
      {msg && <div className="mb-3 rounded-lg bg-up/10 px-3 py-2 text-sm text-up">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card divide-y divide-black/5 dark:divide-white/10">
          {authors.map((a) => (
            <button key={a.id} onClick={() => setSel(a)} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${sel?.id === a.id ? "bg-accent/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"}`}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{a.firstName.charAt(0)}</span>
              <div className="flex-1"><div className="font-medium">{a.firstName} {a.lastName}</div><div className="text-xs text-black/40">/{a.slug}</div></div>
              {a.verifyStatus === "verified" && <span className="chip !py-0 text-[10px] !border-up/40 text-up">✓</span>}
            </button>
          ))}
          {authors.length === 0 && <p className="p-4 text-sm text-black/50">{t("a.noAuthors")}</p>}
        </div>

        {!sel ? <div className="card grid place-items-center p-10 text-sm text-black/50">{t("a.selectAuthor")}</div> : (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{sel.firstName} {sel.lastName}</h2>
                <div className="flex gap-2">
                  <Link href={`/author/${sel.slug}`} className="btn-ghost text-xs">{t("a.authorPage")}</Link>
                  <button className="btn-ghost text-xs !text-down" onClick={remove}>{t("a.delete")}</button>
                  <button className="btn-primary text-xs" onClick={save}>{t("a.save")}</button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">{t("a.name")}</label><input className="input" value={sel.firstName} onChange={(e) => setSel({ ...sel, firstName: e.target.value })} /></div>
                <div><label className="label">{t("a.lastName")}</label><input className="input" value={sel.lastName} onChange={(e) => setSel({ ...sel, lastName: e.target.value })} /></div>
                <div><label className="label">{t("a.photoUrl")}</label><input className="input" value={sel.avatar} onChange={(e) => setSel({ ...sel, avatar: e.target.value })} /></div>
                <div>
                  <label className="label">{t("a.verifyStatus")}</label>
                  <select className="input" value={sel.verifyStatus} onChange={(e) => setSel({ ...sel, verifyStatus: e.target.value })}>
                    <option value="pending">{t("status.review")}</option><option value="verified">{t("a.verified")}</option><option value="rejected">{t("a.rejected")}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t("a.company")}</label>
                  <select className="input" value={sel.companyId ?? ""} onChange={(e) => setSel({ ...sel, companyId: e.target.value || null })}>
                    <option value="">— нет —</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <details className="mt-3 rounded-xl border border-black/[0.07] dark:border-white/10" open>
                <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">{t("co.profile")}</summary>
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className="label">{t("a.bio")}</label><textarea className="input resize-y" rows={2} value={sel.profile.bio ?? ""} onChange={(e) => setProfile("bio", e.target.value)} /></div>
                  {fields.map((f) => (
                    <div key={f.key}><label className="label">{f.label}</label><input className="input" value={sel.profile[f.key] ?? ""} onChange={(e) => setProfile(f.key, e.target.value)} /></div>
                  ))}
                </div>
              </details>
            </div>

            {/* capabilities */}
            <div className="card p-5">
              <h3 className="mb-3 font-semibold">Индивидуальные права автора</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {AUTHOR_CAPABILITIES.map((c) => (
                  <label key={c.key} className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2 text-sm dark:border-white/10">
                    {c.label}
                    <button onClick={() => setCap(c.key, !sel.capabilities[c.key])} className={`h-5 w-9 rounded-full p-0.5 transition ${sel.capabilities[c.key] ? "bg-up" : "bg-black/20"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white transition ${sel.capabilities[c.key] ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
