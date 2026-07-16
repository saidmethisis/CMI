"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPANY_CAPABILITIES, COMPANY_SECTIONS } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n";

type Company = {
  id: string; slug: string; name: string; active: boolean; verified: boolean; premium: boolean; featured: boolean;
  ownerUserId: string | null; capabilities: Record<string, boolean>; sections: string[]; profile: Record<string, string>;
};
type User = { id: string; name: string; email: string };

const groups: { title: string; fields: { key: string; label: string }[] }[] = [
  { title: "Основная информация", fields: [
    { key: "shortName", label: "Краткое название" }, { key: "legalName", label: "Полное юр. название" },
    { key: "logo", label: "Логотип (URL)" }, { key: "cover", label: "Обложка (URL)" },
    { key: "description", label: "Описание" }, { key: "history", label: "История компании" },
    { key: "foundedYear", label: "Дата основания" }, { key: "country", label: "Страна" }, { key: "city", label: "Город" },
    { key: "address", label: "Адрес" }, { key: "zip", label: "Индекс" }, { key: "geo", label: "Координаты (lat,lng)" },
  ]},
  { title: "Контакты", fields: [
    { key: "phone", label: "Телефон" }, { key: "phone2", label: "Доп. телефон" }, { key: "email", label: "Email" },
    { key: "website", label: "Website" }, { key: "telegram", label: "Telegram" }, { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" }, { key: "linkedin", label: "LinkedIn" }, { key: "youtube", label: "YouTube" }, { key: "tiktok", label: "TikTok" },
  ]},
  { title: "Юридические данные", fields: [
    { key: "inn", label: "ИНН" }, { key: "regNumber", label: "Рег. номер" }, { key: "license", label: "Лицензия" },
    { key: "checkStatus", label: "Статус проверки" }, { key: "responsible", label: "Ответственное лицо" },
  ]},
  { title: "SEO", fields: [
    { key: "seoTitle", label: "SEO Title" }, { key: "seoDescription", label: "SEO Description" }, { key: "seoKeywords", label: "SEO Keywords" },
    { key: "og", label: "Open Graph (URL)" }, { key: "schema", label: "Schema.org (JSON)" },
  ]},
];

const flags: { key: keyof Company; label: string }[] = [
  { key: "active", label: "Активна" }, { key: "verified", label: "Проверена" }, { key: "premium", label: "Премиум" }, { key: "featured", label: "Рекомендуемая" },
];

export default function CompaniesPage() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sel, setSel] = useState<Company | null>(null);
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = async () => {
    const [c, u] = await Promise.all([fetch("/api/admin/companies", { cache: "no-store" }).then((r) => r.json()), fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json())]);
    setCompanies(c.data); setUsers(u.data);
    setSel((prev) => (prev ? c.data.find((x: Company) => x.id === prev.id) ?? null : null));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const r = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const j = await r.json();
    if (r.ok) { setNewName(""); setCreating(false); await load(); setSel(j.data); } else setMsg(j.error?.message || "Ошибка");
  };
  const save = async () => {
    if (!sel) return;
    const r = await fetch("/api/admin/companies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sel) });
    setMsg(r.ok ? "Сохранено" : "Ошибка сохранения"); setTimeout(() => setMsg(""), 2000); if (r.ok) load();
  };
  const remove = async () => {
    if (!sel || !confirm(`Удалить компанию «${sel.name}»?`)) return;
    await fetch("/api/admin/companies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel.id }) });
    setSel(null); load();
  };

  const setProfile = (k: string, v: string) => setSel((s) => (s ? { ...s, profile: { ...s.profile, [k]: v } } : s));
  const setFlag = (k: keyof Company, v: boolean) => setSel((s) => (s ? { ...s, [k]: v } : s));
  const setCap = (k: string, v: boolean) => setSel((s) => (s ? { ...s, capabilities: { ...s.capabilities, [k]: v } } : s));
  const toggleSection = (k: string) => setSel((s) => (s ? { ...s, sections: s.sections.includes(k) ? s.sections.filter((x) => x !== k) : [...s.sections, k] } : s));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">{t("a.hCompanies")}</h1></div>
        <button className="btn-primary text-sm" onClick={() => setCreating((v) => !v)}>+ {t("a.create")}</button>
      </div>
      {creating && (
        <div className="card mb-3 flex flex-wrap gap-2 p-3">
          <input className="input min-w-0 flex-1" placeholder="Название компании" value={newName} autoFocus onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
          <button className="btn-primary shrink-0" onClick={create}>{t("a.create")}</button>
        </div>
      )}
      {msg && <div className="mb-3 rounded-lg bg-up/10 px-3 py-2 text-sm text-up">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card divide-y divide-black/5 dark:divide-white/10">
          {companies.map((c) => (
            <button key={c.id} onClick={() => setSel(c)} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${sel?.id === c.id ? "bg-accent/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"}`}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-bold text-white">{c.name.charAt(0)}</span>
              <div className="flex-1"><div className="font-medium">{c.name}</div><div className="text-xs text-black/40">/{c.slug}</div></div>
              {c.verified && <span className="chip !py-0 text-[10px] !border-up/40 text-up">✓</span>}
            </button>
          ))}
          {companies.length === 0 && <p className="p-4 text-sm text-black/50">{t("a.noCompanies")}</p>}
        </div>

        {!sel ? <div className="card grid place-items-center p-10 text-sm text-black/50">Выберите или создайте компанию.</div> : (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{sel.name}</h2>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs !text-down" onClick={remove}>{t("a.delete")}</button>
                  <button className="btn-primary text-xs" onClick={save}>{t("a.save")}</button>
                </div>
              </div>
              <label className="label">{t("a.title")}</label>
              <input className="input mb-4" value={sel.name} onChange={(e) => setSel({ ...sel, name: e.target.value })} />

              {groups.map((g) => (
                <details key={g.title} className="mb-2 rounded-xl border border-black/[0.07] dark:border-white/10" open={g.title === "Основная информация"}>
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">{g.title}</summary>
                  <div className="grid gap-3 p-3 sm:grid-cols-2">
                    {g.fields.map((f) => (
                      <div key={f.key}><label className="label">{f.label}</label><input className="input" value={sel.profile[f.key] ?? ""} onChange={(e) => setProfile(f.key, e.target.value)} /></div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            {/* settings flags + owner */}
            <div className="card p-5">
              <h3 className="mb-3 font-semibold">{t("co.settings")}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {flags.map((f) => (
                  <label key={f.key as string} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!sel[f.key]} onChange={(e) => setFlag(f.key, e.target.checked)} />{f.label}</label>
                ))}
              </div>
              <label className="label mt-4">{t("a.owner")}</label>
              <select className="input max-w-sm" value={sel.ownerUserId ?? ""} onChange={(e) => setSel({ ...sel, ownerUserId: e.target.value || null })}>
                <option value="">— не назначен —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>

            {/* individual capabilities */}
            <div className="card p-5">
              <h3 className="mb-3 font-semibold">Индивидуальные права компании</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMPANY_CAPABILITIES.map((c) => (
                  <label key={c.key} className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2 text-sm dark:border-white/10">
                    {c.label}
                    <button onClick={() => setCap(c.key, !sel.capabilities[c.key])} className={`h-5 w-9 rounded-full p-0.5 transition ${sel.capabilities[c.key] ? "bg-up" : "bg-black/20"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white transition ${sel.capabilities[c.key] ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* cabinet sections */}
            <div className="card p-5">
              <h3 className="mb-1 font-semibold">Разделы кабинета компании</h3>
              <p className="mb-3 text-xs text-black/50 dark:text-white/50">Отметьте, какие разделы доступны этой компании.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COMPANY_SECTIONS.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.sections.includes(s.key)} onChange={() => toggleSection(s.key)} />{s.label}</label>
                ))}
              </div>
              <Link href="/company" className="btn-ghost mt-4 inline-flex text-xs">Открыть кабинет компании →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
