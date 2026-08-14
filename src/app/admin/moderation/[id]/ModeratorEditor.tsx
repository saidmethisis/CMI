"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import RichEditor from "@/components/RichEditor";
import BulkImageUpload from "@/components/BulkImageUpload";
import TagPicker from "@/components/TagPicker";
import ImageUpload from "@/components/ImageUpload";

// Страница проверки материала (ТЗ, блок 3): «абсолютная копия страницы автора
// с мультиязычным Rich Editor». Модератор правит текст и форматирование прямо
// здесь, а не только жмёт «Одобрить / Отклонить».
//
// Отличие от авторской формы одно: правка не отправляет материал на повторную
// модерацию — он уже в очереди, и решение принимает тот же человек.

type LangCode = "ru" | "uz" | "en";
type Fields = { title: string; lead: string; body: string };
const TABS: { code: LangCode; label: string }[] = [
  { code: "ru", label: "RU" }, { code: "uz", label: "UZ" }, { code: "en", label: "EN" },
];

export type ModerationArticle = {
  id: string; slug: string; status: string; categorySlug: string; cover: string; tags: string;
  authorName: string; company: string | null; breaking?: boolean;
  translations: Partial<Record<LangCode, Fields>>;
  base: Fields;
};

export default function ModeratorEditor({ article }: { article: ModerationArticle }) {
  const router = useRouter();
  const { t } = useI18n();
  const { categories } = useTaxonomy();
  const catName = useCatName();

  // Если языковых версий в базе нет (старый материал) — базовые поля считаем
  // русской версией, иначе модератору нечего было бы править.
  const initial: Record<LangCode, Fields> = {
    ru: article.translations.ru ?? { ...article.base },
    uz: article.translations.uz ?? { title: "", lead: "", body: "" },
    en: article.translations.en ?? { title: "", lead: "", body: "" },
  };

  const [tab, setTab] = useState<LangCode>("ru");
  const [tr, setTr] = useState(initial);
  const [category, setCategory] = useState(article.categorySlug);
  const [cover, setCover] = useState(article.cover);
  const [tags, setTags] = useState(article.tags);
  const [bulkInsert, setBulkInsert] = useState<((urls: string[]) => void) | null>(null);
  const [breaking, setBreakingState] = useState(Boolean(article.breaking));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const cur = tr[tab];
  const setCur = (patch: Partial<Fields>) => setTr((s) => ({ ...s, [tab]: { ...s[tab], ...patch } }));
  const filled = TABS.filter((l) => tr[l.code].title.trim() || tr[l.code].lead.trim() || tr[l.code].body.trim()).map((l) => l.code);

  const save = async () => {
    setBusy(true); setError(""); setMsg("");
    try {
      const r = await fetch("/api/admin/article", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, translations: tr, categorySlug: category, cover, tags }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error?.message ?? "—"); return; }
      setMsg(t("mod.saved"));
      router.refresh();
    } finally { setBusy(false); }
  };

  // Срочность ставится отдельным запросом: это редакционное решение, не часть
  // правки текста, и применяться должно сразу, без сохранения всей формы.
  const markBreaking = async (on: boolean, hours: number) => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/article", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, breaking: { on, hours } }),
      });
      if (!r.ok) { setError((await r.json()).error?.message ?? "—"); return; }
      setBreakingState(on);
      setMsg(on ? t("brk.isOn") : t("brk.isOff"));
      router.refresh();
    } finally { setBusy(false); }
  };

  const decide = async (action: "approve" | "return" | "reject") => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, action }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error?.message ?? "—"); return; }
      router.push("/admin/moderation");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin/moderation" className="btn-ghost text-sm">← {t("adm.modTitle")}</Link>
        <span className="chip text-xs">{t(`status.${article.status}`)}</span>
        <span className="text-sm text-black/60 dark:text-white/65">{article.company ?? article.authorName}</span>
        <Link href={`/n/${article.slug}?preview=1`} target="_blank" className="ml-auto btn-ghost text-sm">
          {t("mod.preview")}
        </Link>
      </div>

      {/* Языковые вкладки — как в панели автора */}
      <div className="mb-3 flex gap-1">
        {TABS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setTab(l.code)}
            className={`relative rounded-lg px-3 py-1.5 text-sm font-bold ${
              tab === l.code ? "bg-brand text-white" : "text-black/60 hover:bg-black/5 dark:text-white/65 dark:hover:bg-white/10"
            }`}
          >
            {l.label}
            {filled.includes(l.code) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-up" />}
          </button>
        ))}
      </div>

      <label className="label">{t("author.title")} ({tab.toUpperCase()})</label>
      <input className="ym-disable-keys input mb-3" value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />

      <label className="label">{t("author.lead")} ({tab.toUpperCase()})</label>
      <textarea className="ym-disable-keys input mb-3 resize-y" rows={2} value={cur.lead} onChange={(e) => setCur({ lead: e.target.value })} />

      <label className="label">{t("author.text")} ({tab.toUpperCase()})</label>
      <RichEditor
        value={cur.body}
        onChange={(html) => setCur({ body: html })}
        placeholder={t("author.text")}
        onRequestImages={(insert) => setBulkInsert(() => insert)}
      />
      {bulkInsert && <BulkImageUpload onInsert={bulkInsert} onClose={() => setBulkInsert(null)} />}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("author.category")}</label>
          <select className="ym-disable-keys input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{catName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("author.tags")}</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>
      </div>

      {/* Срочная новость */}
      <div className="card mt-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{t("brk.title")}</span>
          <span className={`chip text-xs ${breaking ? "!border-accent text-accent" : ""}`}>
            {breaking ? t("brk.isOn") : t("brk.isOff")}
          </span>
        </div>
        <p className="mt-1 text-xs text-black/55 dark:text-white/55">{t("brk.hint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => markBreaking(true, 6)} className="btn-ghost text-xs">{t("brk.on6")}</button>
          <button type="button" disabled={busy} onClick={() => markBreaking(true, 24)} className="btn-ghost text-xs">{t("brk.on24")}</button>
          <button type="button" disabled={busy} onClick={() => markBreaking(true, 0)} className="btn-ghost text-xs">{t("brk.onForever")}</button>
          {breaking && (
            <button type="button" disabled={busy} onClick={() => markBreaking(false, 0)} className="btn-ghost text-xs !text-down">{t("brk.off")}</button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">{t("author.cover")}</label>
        <ImageUpload value={cover} onChange={setCover} />
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-down">{error}</p>}
      {msg && <p className="mt-3 text-sm font-semibold text-up">{msg}</p>}

      <div className="sticky bottom-0 mt-6 flex flex-wrap gap-2 border-t border-black/10 bg-[var(--surface)] py-3 dark:border-white/10 dark:bg-ink-surface">
        <button type="button" disabled={busy} onClick={save} className="btn bg-brand text-white disabled:opacity-50">
          {busy ? "…" : t("mod.save")}
        </button>
        <button type="button" disabled={busy} onClick={() => decide("approve")} className="btn bg-up text-white disabled:opacity-50">
          {t("mod.approve")}
        </button>
        <button type="button" disabled={busy} onClick={() => decide("return")} className="btn-ghost">
          {t("mod.return")}
        </button>
        <button type="button" disabled={busy} onClick={() => decide("reject")} className="btn-ghost !text-down">
          {t("mod.reject")}
        </button>
      </div>
    </div>
  );
}
