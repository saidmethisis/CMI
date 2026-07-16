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

type A = { id: string; slug: string; title: string; lead: string; body: string; categorySlug: string; status: string; createdAt: string; views: number };

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
  const [busy, setBusy] = useState(false);

  const list = statusFilter[tab] ? articles.filter(statusFilter[tab]) : [];

  const save = async (asDraft: boolean) => {
    if (!editing) return;
    setBusy(true);
    try {
      const r = await fetch("/api/author/article", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, title: editing.title, lead: editing.lead, body: editing.body, categorySlug: editing.categorySlug, asDraft }) });
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
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent font-bold text-white">{name.charAt(0)}</span>
          <div className="min-w-0"><div className="truncate text-sm font-bold">{name}</div><div className="text-[11px] text-black/45 dark:text-white/45">{t("menu.cabAuthor")}</div></div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((k) => (
            <button key={k} onClick={() => { setTab(k); setEditing(null); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${tab === k ? "bg-accent/10 font-semibold text-accent" : "text-black/65 hover:bg-black/[0.04] dark:text-white/65 dark:hover:bg-white/[0.06]"}`}>{t(`wc.${k}`)}</button>
          ))}
        </nav>
      </aside>

      <section>
        {tab === "dashboard" && (
          <WriterDashboard articles={articles} name={name} onNav={(k) => { setTab(k); setEditing(null); }} onEdit={(a) => setEditing(a)} />
        )}
        {tab === "create" && <AuthorEditor />}

        {editing && (
          <div className="card mb-4 space-y-3 p-5">
            <h3 className="font-serif text-lg font-bold">{t("wc.editing")}</h3>
            <div><label className="label">{t("author.titleField")}</label><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><label className="label">{t("author.lead")}</label><textarea className="input resize-y" rows={2} value={editing.lead} onChange={(e) => setEditing({ ...editing, lead: e.target.value })} /></div>
            <div>
              <label className="label">{t("author.category")}</label>
              <select className="input" value={editing.categorySlug} onChange={(e) => setEditing({ ...editing, categorySlug: e.target.value })}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">{t("author.text")}</label><textarea className="input resize-y font-mono text-sm" rows={8} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>{t("wc.cancel")}</button>
              <button className="btn-ghost" disabled={busy} onClick={() => save(true)}>{t("wc.saveDraft")}</button>
              <button className="btn-primary" disabled={busy} onClick={() => save(false)}>{t("wc.saveReview")}</button>
            </div>
          </div>
        )}

        {statusFilter[tab] && !editing && (
          <div className="card divide-y divide-black/5 dark:divide-white/10">
            {list.length === 0 && <p className="p-4 text-sm text-black/50">{t("wc.empty")}</p>}
            {list.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                <span className="chip !py-0.5 text-[11px]">{t(`status.${a.status}`)}</span>
                {a.status === "published" && <Link href={`/article/${a.slug}`} className="btn-ghost text-xs">{t("wc.open")}</Link>}
                <button className="btn-ghost text-xs" onClick={() => setEditing(a)}>{t("wc.edit")}</button>
                <button className="btn-ghost text-xs !text-down" onClick={() => del(a)}>{t("wc.del")}</button>
              </div>
            ))}
          </div>
        )}

        {tab === "media" && (
          <div className="card p-5">
            <h3 className="mb-1 font-serif text-lg font-bold">{t("wc.stories")}</h3>
            <p className="mb-3 text-sm text-black/50 dark:text-white/50">{t("wc.storiesNote")}</p>
            <StoryUploader />
          </div>
        )}
        {tab === "comments" && <WriterComments />}
        {tab === "notifications" && <WriterNotifications />}
        {tab === "history" && (
          <div className="card p-6 text-sm text-black/50 dark:text-white/50">{t("wc.section")} «{t(`wc.${tab}`)}» — {t("wc.available")}.</div>
        )}
        {tab === "profile" && (
          <div className="card p-6"><p className="text-sm text-black/60 dark:text-white/70">{t("wc.profileNote")}</p><Link href="/account" className="btn-primary mt-3 inline-flex text-sm">{t("wc.openProfile")}</Link></div>
        )}
      </section>
    </div>
  );
}
