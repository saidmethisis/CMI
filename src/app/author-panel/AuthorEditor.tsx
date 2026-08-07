"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import { imageFileToUrl, fileToDataUrl, uploadDataUrl } from "@/lib/upload";
import RichEditor from "@/components/RichEditor";
import BulkImageUpload from "@/components/BulkImageUpload";

type Social = { label: string; url: string };
type LangCode = "ru" | "uz" | "en";
type LangFields = { title: string; lead: string; body: string };

const LANG_TABS: { code: LangCode; label: string }[] = [
  { code: "ru", label: "RU" }, { code: "uz", label: "UZ" }, { code: "en", label: "EN" },
];
const EMPTY: Record<LangCode, LangFields> = {
  ru: { title: "", lead: "", body: "" },
  uz: { title: "", lead: "", body: "" },
  en: { title: "", lead: "", body: "" },
};

export default function AuthorEditor() {
  const router = useRouter();
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t, lang: uiLang } = useI18n();
  // Массовая загрузка (ТЗ, блок 3): окно открывается из панели редактора,
  // а вставкой занимается сам редактор — он знает, где стоит курсор.
  const [bulkInsert, setBulkInsert] = useState<((urls: string[]) => void) | null>(null);

  // Один материал — три языковые версии. Заполнять можно любую (минимум одну);
  // незаполненные языки на сайте показываются на языке-фолбэке.
  const [tab, setTab] = useState<LangCode>((uiLang as LangCode) ?? "ru");
  const [tr, setTr] = useState<Record<LangCode, LangFields>>(EMPTY);
  const cur = tr[tab];
  const setCur = (patch: Partial<LangFields>) => setTr((s) => ({ ...s, [tab]: { ...s[tab], ...patch } }));
  // «Заполнен» = есть хоть одно непустое поле — то же условие, по которому
  // сервер сохраняет языковую версию.
  const filledLangs = LANG_TABS.filter((l) => tr[l.code].title.trim() || tr[l.code].lead.trim() || tr[l.code].body.trim()).map((l) => l.code);

  const [category, setCategory] = useState(categories[0]?.slug ?? "startups");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [socials, setSocials] = useState<Social[]>([{ label: "Telegram", url: "" }]);
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [error, setError] = useState("");

  const onCover = async (f?: File) => {
    if (!f) return;
    setCoverBusy(true);
    try { setCover(await imageFileToUrl(f)); } finally { setCoverBusy(false); }
  };

  const setSocial = (i: number, patch: Partial<Social>) => setSocials((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addSocial = () => setSocials((s) => [...s, { label: "", url: "" }]);
  const removeSocial = (i: number) => setSocials((s) => s.filter((_, j) => j !== i));

  const submit = async (asDraft = false) => {
    setError("");
    // Достаточно одной полностью заполненной языковой версии.
    const complete = LANG_TABS.map((l) => l.code).filter((l) => tr[l].title.trim() && tr[l].lead.trim() && tr[l].body.trim());
    if (complete.length === 0) { setError(t("author.requiredLang")); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/author/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: tr, categorySlug: category, tags,
          // authorName пустой — сервер подставит реальное имя пользователя
          authorName: "",
          asDraft,
          cover: cover || undefined,
          videoUrl: videoUrl.trim() || undefined,
          socials: socials.filter((s) => s.label.trim() && s.url.trim()),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || t("misc.error"));
      alert(asDraft ? t("author.draftSaved") : t("author.submitted"));
      router.refresh();
      setTr(EMPTY); setTags(""); setCover(""); setVideoUrl(""); setSocials([{ label: "Telegram", url: "" }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <h2 className="mb-4 font-serif text-lg font-bold">{t("author.new")}</h2>
      {error && <div className="mb-4 rounded-xl border border-down/30 bg-down/5 px-4 py-3 text-sm text-down" role="alert">{error}</div>}

      {/* cover upload */}
      <label className="label">{t("author.cover")}</label>
      <div className="mb-3 flex items-center gap-3">
        <label className={`btn-ghost text-xs ${coverBusy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
          <Icon name="upload" size={14} /> {coverBusy ? t("author.uploading") : t("author.upload")}
          <input type="file" accept="image/*" disabled={coverBusy} className="sr-only" onChange={(e) => onCover(e.target.files?.[0])} />
        </label>
        {cover && !coverBusy && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="cover" className="h-12 w-20 rounded-md object-cover" />
            <button className="text-xs text-down" onClick={() => setCover("")}>{t("author.remove")}</button>
          </div>
        )}
      </div>

      {/* lead video for the header — link or upload from device */}
      <label className="label">{t("author.videoHeader")}</label>
      <div className="mb-1 flex gap-2">
        <input className="input" value={videoUrl.startsWith("data:") || videoUrl.startsWith("/uploads/") ? "" : videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/… , https://…/video.mp4" />
        <label className="btn-ghost shrink-0 cursor-pointer text-xs">
          <Icon name="upload" size={14} /> {t("author.fromDevice")}
          <input type="file" accept="video/mp4,video/webm,video/ogg" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 25 * 1024 * 1024) { alert(t("author.videoTooBig")); return; }
            setVideoUrl(await uploadDataUrl(await fileToDataUrl(f)));
          }} />
        </label>
      </div>
      {(videoUrl.startsWith("data:") || videoUrl.startsWith("/uploads/")) && (
        <div className="mb-1 flex items-center gap-2 text-xs text-up">
          {t("author.videoUploaded")} <button type="button" className="text-down" onClick={() => setVideoUrl("")}>{t("author.removeVideo")}</button>
        </div>
      )}
      <p className="mb-3 text-xs text-black/60 dark:text-white/65">{t("author.videoNote")}</p>

      {/* Языковые вкладки: один материал — три версии. Точка = язык заполнен. */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
          {LANG_TABS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setTab(l.code)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${tab === l.code ? "bg-[var(--surface)] text-accent shadow-sm dark:bg-ink-surface" : "text-black/60 hover:text-black/75 dark:text-white/65 dark:hover:text-white/75"}`}
            >
              {l.label}
              {filledLangs.includes(l.code) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-up" />}
            </button>
          ))}
        </div>
        <span className="text-xs text-black/60 dark:text-white/65">{t("author.langHint")}</span>
      </div>

      <label className="label">{t("author.titleField")} * <span className="text-black/35 dark:text-white/35">({tab.toUpperCase()})</span></label>
      <input className="input mb-3 font-serif text-lg" value={cur.title} onChange={(e) => setCur({ title: e.target.value })} placeholder={t("author.titleField")} />

      <label className="label">{t("author.lead")} * <span className="text-black/35 dark:text-white/35">({tab.toUpperCase()})</span></label>
      <textarea className="input mb-3 resize-y" rows={2} value={cur.lead} onChange={(e) => setCur({ lead: e.target.value })} placeholder={t("author.lead")} />

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t("author.category")} *</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{catName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("author.tags")}</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="startup, ..." />
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <label className="label !mb-0">{t("author.text")} * <span className="text-black/35 dark:text-white/35">({tab.toUpperCase()})</span></label>
      </div>
      <RichEditor
        value={cur.body}
        onChange={(html) => setCur({ body: html })}
        placeholder={t("author.text")}
        onRequestImages={(insert) => setBulkInsert(() => insert)}
      />
      {bulkInsert && <BulkImageUpload onInsert={bulkInsert} onClose={() => setBulkInsert(null)} />}

      {/* author socials */}
      <div className="mt-4">
        <label className="label">{t("author.socials")}</label>
        <div className="space-y-2">
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-32" value={s.label} onChange={(e) => setSocial(i, { label: e.target.value })} placeholder="Telegram" />
              <input className="input flex-1" value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} placeholder="https://t.me/username" />
              <button className="btn-ghost !px-3 text-xs" onClick={() => removeSocial(i)} aria-label={t("wc.del")}>×</button>
            </div>
          ))}
        </div>
        <button className="btn-ghost mt-2 text-xs" onClick={addSocial}><Icon name="plus" size={14} /> {t("author.addSocial")}</button>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" disabled={busy} onClick={() => submit(true)}>{t("author.saveDraft")}</button>
        <button className="btn-primary" disabled={busy} onClick={() => submit(false)}>{busy ? "…" : t("author.submit")}</button>
      </div>
    </div>
  );
}
