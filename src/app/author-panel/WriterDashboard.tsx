"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";

type A = { id: string; slug: string; title: string; lead: string; body: string; categorySlug: string; status: string; createdAt: string; views: number };
type Todo = { id: string; text: string; done: boolean };

const NAV = ["create", "all", "draft", "published", "review", "archived", "comments", "media"];
const STATUS_TONE: Record<string, string> = {
  published: "bg-up/12 text-up", review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  returned: "bg-down/12 text-down", draft: "bg-black/8 text-black/55 dark:bg-white/10 dark:text-white/60",
  archived: "bg-black/8 text-black/45 dark:bg-white/10 dark:text-white/45",
};

export default function WriterDashboard({ articles, name, onNav, onEdit }: { articles: A[]; name: string; onNav: (tab: string) => void; onEdit: (a: A) => void }) {
  const { t } = useI18n();
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const catBySlug = (slug: string) => { const c = categories.find((x) => x.slug === slug); return c ? catName(c) : slug; };

  const counts = {
    all: articles.length,
    published: articles.filter((a) => a.status === "published").length,
    review: articles.filter((a) => a.status === "review" || a.status === "returned").length,
    views: articles.reduce((s, a) => s + a.views, 0),
  };
  const recent = [...articles].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 8);

  // per-browser to-do list (adapted from the Notion "To-Do" widget)
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    try { const raw = localStorage.getItem("wc-todos"); if (raw) setTodos(JSON.parse(raw)); } catch {}
  }, []);
  const persist = (next: Todo[]) => { setTodos(next); try { localStorage.setItem("wc-todos", JSON.stringify(next)); } catch {} };
  const addTodo = () => { const text = draft.trim(); if (!text) return; persist([...todos, { id: Math.random().toString(36).slice(2), text, done: false }]); setDraft(""); };
  const toggle = (id: string) => persist(todos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const removeTodo = (id: string) => persist(todos.filter((x) => x.id !== id));

  return (
    <div className="space-y-5">
      {/* greeting band — replaces the typewriter cover, no image/icon */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-r from-accent/12 via-accent/5 to-transparent p-6 dark:border-white/10">
        <div className="text-xs uppercase tracking-widest text-accent">{t("wc.hello")}</div>
        <h2 className="mt-1 font-serif text-2xl font-bold">{name}</h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">{t("wc.startHint")}</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[[t("wc.total"), counts.all], [t("wc.pub"), counts.published], [t("wc.rev"), counts.review], [t("wc.views"), counts.views.toLocaleString("ru-RU")]].map(([l, v]) => (
          <div key={l as string} className="card p-4"><div className="text-2xl font-bold tabular-nums">{v}</div><div className="text-xs text-black/45 dark:text-white/45">{l}</div></div>
        ))}
      </div>

      {/* three-column: Navigation / Notes / Quick Links */}
      <div className="grid gap-4 lg:grid-cols-[200px_1fr_200px]">
        <div className="card p-4">
          <div className="mb-2 border-b border-black/5 pb-2 text-sm font-bold dark:border-white/10">{t("wc.navigation")}</div>
          <div className="flex flex-col gap-0.5">
            {NAV.map((k) => (
              <button key={k} onClick={() => onNav(k)} className="rounded-md px-2 py-1.5 text-left text-sm text-black/70 hover:bg-black/[0.04] dark:text-white/70 dark:hover:bg-white/[0.06]">{t(`wc.${k}`)}</button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 border-b border-black/5 pb-2 text-sm font-bold dark:border-white/10">{t("wc.notes")} · {t("wc.todo")}</div>
          <div className="mb-3 flex gap-2">
            <input className="input !py-1.5 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} placeholder={t("wc.notePlaceholder")} />
            <button className="btn-ghost shrink-0 text-xs" onClick={addTodo}>{t("wc.addNote")}</button>
          </div>
          <ul className="space-y-1">
            {todos.length === 0 && <li className="text-xs text-black/40 dark:text-white/40">{t("wc.noteHint")}</li>}
            {todos.map((x) => (
              <li key={x.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
                <input type="checkbox" checked={x.done} onChange={() => toggle(x.id)} className="h-4 w-4 accent-accent" />
                <span className={`flex-1 text-sm ${x.done ? "text-black/35 line-through dark:text-white/30" : ""}`}>{x.text}</span>
                <button className="text-xs text-black/30 opacity-0 transition group-hover:opacity-100 hover:text-down" onClick={() => removeTodo(x.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <div className="mb-2 border-b border-black/5 pb-2 text-sm font-bold dark:border-white/10">{t("wc.quickLinks")}</div>
          <div className="flex flex-col gap-1.5 text-sm">
            <button onClick={() => onNav("create")} className="text-left text-accent hover:underline">{t("wc.create")}</button>
            <Link href="/account" className="text-accent hover:underline">{t("wc.myProfile")}</Link>
            <a href="/feed.xml" target="_blank" rel="noopener" className="text-accent hover:underline">{t("wc.rssFeed")}</a>
          </div>
        </div>
      </div>

      {/* Current drafts table — adapted from the Notion "Current Draft" table */}
      <div className="card overflow-hidden">
        <div className="border-b border-black/5 px-4 py-3 text-sm font-bold dark:border-white/10">{t("wc.currentDrafts")}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-black/40 dark:border-white/10 dark:text-white/40">
                <th className="px-4 py-2 font-medium">{t("wc.colName")}</th>
                <th className="px-4 py-2 font-medium">{t("wc.colStatus")}</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">{t("wc.colCategory")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("wc.colViews")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-black/40 dark:text-white/40">{t("wc.noDrafts")}</td></tr>}
              {recent.map((a) => (
                <tr key={a.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:border-white/[0.06] dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5">
                    <button onClick={() => onEdit(a)} className="text-left font-medium hover:text-accent">{a.title}</button>
                  </td>
                  <td className="px-4 py-2.5"><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[a.status] ?? STATUS_TONE.draft}`}>{t(`status.${a.status}`)}</span></td>
                  <td className="hidden px-4 py-2.5 text-black/55 dark:text-white/55 sm:table-cell">{catBySlug(a.categorySlug)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-black/60 dark:text-white/60">{a.views.toLocaleString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
