"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthorEditor from "./AuthorEditor";
import WriterDashboard from "./WriterDashboard";
import StoryUploader from "@/components/StoryUploader";
import WriterComments from "./WriterComments";
import WriterNotifications from "./WriterNotifications";
import { useTaxonomy } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";

type LangCode = "ru" | "uz" | "en";
type LangFields = { title: string; lead: string; body: string };
type A = {
  id: string; slug: string; title: string; lead: string; body: string; categorySlug: string;
  status: string; createdAt: string; views: number;
  translations?: Partial<Record<LangCode, LangFields>>;
};

const LANG_TABS: { code: LangCode; label: string }[] = [
  { code: "ru", label: "RU" }, { code: "uz", label: "UZ" }, { code: "en", label: "EN" },
];
const SECTIONS = ["dashboard", "create", "all", "draft", "published", "review", "archived", "media", "comments", "notifications", "history", "profile"];
const statusFilter: Record<string, (a: A) => boolean> = {
  all: () => true, draft: (a) => a.status === "draft", published: (a) => a.status === "published",
  review: (a) => a.status === "review" || a.status === "returned", archived: (a) => a.status === "archived",
};

export default function AuthorSections({ articles, name }: { articles: A[]; name: string }) {
  const router = useRouter();
  const { categories } = useTaxonomy();
  const { t } = useI18n();
  const [tab, setTab] = useState("dashboard");
  const [editing, setEditing] = useState<A | null>(null);
  const [editLang, setEditLang] = useState<LangCode>("ru");
  const [tr, setTr] = useState<Record<LangCode, LangFields>>({ ru: { title: "", lead: "", body: "" }, uz: { title: "", lead: "", body: "" }, en: { title: "", lead: "", body: "" } });
  const [busy, setBusy] = useState(false);

  const list = statusFilter[tab] ? articles.filter(statusFilter[tab]) : [];

  // Открываем статью в редакторе: все языковые версии лежат в translations.
  // Для старых статей (до мультиязычности) translations пуст — тогда базовые поля идут в RU.
  const openEditor = (a: A) => {
    const base: Record<LangCode, LangFields> = {
      ru: { title: "", lead: "", body: "" }, uz: { title: "", lead: "", body: "" }, en: { title: "", lead: "", body: "" },
    };
    // Загружаем язык, если в нём есть ХОТЬ ЧТО-ТО — то же условие, по которому
    // normalizeTranslations его сохраняет. Раньше фильтр требовал заголовок, и
    // язык, где успели написать только текст, не подгружался в редактор, а
    // следующее сохранение затирало его молча.
    const trLangs = (Object.keys(a.translations ?? {}) as LangCode[])
      .filter((l) => { const v = a.translations?.[l]; return !!(v?.title?.trim() || v?.lead?.trim() || v?.body?.trim()); });
    if (trLangs.length === 0) {
      base.ru = { title: a.title, lead: a.lead, body: a.body };
      setTr(base); setEditLang("ru"); setEditing(a); return;
    }
    for (const l of trLangs) base[l] = a.translations![l]!;
    setTr(base); setEditLang(trLangs[0]); setEditing(a);
  };

  const cur = tr[editLang];
  const setCur = (patch: Partial<LangFields>) => setTr((s) => ({ ...s, [editLang]: { ...s[editLang], ...patch } }));
  // «Заполнен» = есть хоть одно непустое поле. Условие должно совпадать с тем,
  // по которому язык сохраняется и загружается, иначе точка на вкладке врёт.
  const filledLangs = LANG_TABS.filter((l) => tr[l.code].title.trim() || tr[l.code].lead.trim() || tr[l.code].body.trim()).map((l) => l.code);

  const save = async (asDraft: boolean) => {
    if (!editing) return;
    const complete = LANG_TABS.map((l) => l.code).filter((l) => tr[l].title.trim() && tr[l].lead.trim() && tr[l].body.trim());
    if (complete.length === 0) { alert(t("author.requiredLang")); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/author/article", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, translations: tr, categorySlug: editing.categorySlug, asDraft }) });
      const j = await r.json();
      if (!r.ok) { alert(j.error?.message); return; }
      setEditing(null); router.refresh();
    } finally { setBusy(false); }
  };
  const del = async (a: A) => {
    if (!confirm(`${t("wc.del")}: «${a.title}»?`)) return;
    const r = await fetch("/api/author/article", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    const j = await r.json();
    if (!r.ok) { alert(j.error?.message); return; }
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="min-w-0"><div className="truncate text-sm font-bold">{name}</div><div className="text-[11px] text-black/60 dark:text-white/65">{t("menu.cabAuthor")}</div></div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((k) => (
            <button key={k} aria-pressed={tab === k} onClick={() => { setTab(k); setEditing(null); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${tab === k ? "bg-accent/10 font-semibold text-accent" : "text-black/65 hover:bg-black/[0.04] dark:text-white/65 dark:hover:bg-white/[0.06]"}`}>{t(`wc.${k}`)}</button>
          ))}
        </nav>
      </aside>

      <section>
        {tab === "dashboard" && (
          <WriterDashboard articles={articles} name={name} onNav={(k) => { setTab(k); setEditing(null); }} onEdit={openEditor} />
        )}
        {tab === "create" && <AuthorEditor />}

        {editing && (
          <div className="card mb-4 space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-lg font-bold">{t("wc.editing")}</h3>
              <Link href={`/article/${editing.slug}?preview=1`} target="_blank" className="btn-ghost text-xs">{t("wc.preview")}</Link>
            </div>

            {/* языковые вкладки — как в форме создания */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
                {LANG_TABS.map((l) => (
                  <button key={l.code} type="button" onClick={() => setEditLang(l.code)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${editLang === l.code ? "bg-[var(--surface)] text-accent shadow-sm dark:bg-ink-surface" : "text-black/60 hover:text-black/75 dark:text-white/65 dark:hover:text-white/75"}`}>
                    {l.label}
                    {filledLangs.includes(l.code) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-up" />}
                  </button>
                ))}
              </div>
              <span className="text-xs text-black/60 dark:text-white/65">{t("author.langHint")}</span>
            </div>

            <div><label className="label">{t("author.titleField")} <span className="text-black/35 dark:text-white/35">({editLang.toUpperCase()})</span></label><input className="input" value={cur.title} onChange={(e) => setCur({ title: e.target.value })} /></div>
            <div><label className="label">{t("author.lead")} <span className="text-black/35 dark:text-white/35">({editLang.toUpperCase()})</span></label><textarea className="input resize-y" rows={2} value={cur.lead} onChange={(e) => setCur({ lead: e.target.value })} /></div>
            <div>
              <label className="label">{t("author.category")}</label>
              <select className="input" value={editing.categorySlug} onChange={(e) => setEditing({ ...editing, categorySlug: e.target.value })}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">{t("author.text")} <span className="text-black/35 dark:text-white/35">({editLang.toUpperCase()})</span></label><textarea className="input resize-y font-mono text-sm" rows={8} value={cur.body} onChange={(e) => setCur({ body: e.target.value })} /></div>
            {editing.status === "published" && <p className="text-xs text-amber-600 dark:text-amber-400">{t("wc.republishNote")}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>{t("wc.cancel")}</button>
              <button className="btn-ghost" disabled={busy} onClick={() => save(true)}>{t("wc.saveDraft")}</button>
              <button className="btn-primary" disabled={busy} onClick={() => save(false)}>{t("wc.saveReview")}</button>
            </div>
          </div>
        )}

        {statusFilter[tab] && !editing && (
          <div className="card divide-y divide-black/5 dark:divide-white/10">
            {list.length === 0 && <p className="p-4 text-sm text-black/60">{t("wc.empty")}</p>}
            {list.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                <span className="chip !py-0.5 text-[11px]">{t(`status.${a.status}`)}</span>
                {a.status === "published"
                  ? <Link href={`/article/${a.slug}`} target="_blank" className="btn-ghost text-xs">{t("wc.open")}</Link>
                  : <Link href={`/article/${a.slug}?preview=1`} target="_blank" className="btn-ghost text-xs">{t("wc.preview")}</Link>}
                <button className="btn-ghost text-xs" onClick={() => openEditor(a)}>{t("wc.edit")}</button>
                <button className="btn-ghost text-xs !text-down" onClick={() => del(a)}>{t("wc.del")}</button>
              </div>
            ))}
          </div>
        )}

        {tab === "media" && (
          <div className="card p-5">
            <h3 className="mb-1 font-serif text-lg font-bold">{t("wc.stories")}</h3>
            <p className="mb-3 text-sm text-black/60 dark:text-white/65">{t("wc.storiesNote")}</p>
            <StoryUploader />
          </div>
        )}
        {tab === "comments" && <WriterComments />}
        {tab === "notifications" && <WriterNotifications />}
        {tab === "history" && (
          <div className="card p-6 text-sm text-black/60 dark:text-white/65">{t("wc.section")} «{t(`wc.${tab}`)}» — {t("wc.available")}.</div>
        )}
        {tab === "profile" && (
          <div className="card p-6"><p className="text-sm text-black/60 dark:text-white/70">{t("wc.profileNote")}</p><Link href="/account" className="btn-primary mt-3 inline-flex text-sm">{t("wc.openProfile")}</Link></div>
        )}
      </section>
    </div>
  );
}
