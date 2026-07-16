"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import { uploadDataUrl } from "@/lib/upload";

type Social = { label: string; url: string };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function AuthorEditor() {
  const router = useRouter();
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t } = useI18n();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug ?? "startups");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [socials, setSocials] = useState<Social[]>([{ label: "Telegram", url: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCover = async (f?: File) => { if (f) setCover(await uploadDataUrl(await fileToDataUrl(f))); };

  const insertPhoto = async (f?: File) => {
    if (!f) return;
    const url = await uploadDataUrl(await fileToDataUrl(f));
    const ta = bodyRef.current;
    const marker = `\n\n![фото](${url})\n\n`;
    if (ta) {
      const pos = ta.selectionStart ?? body.length;
      setBody(body.slice(0, pos) + marker + body.slice(pos));
    } else {
      setBody(body + marker);
    }
  };

  const setSocial = (i: number, patch: Partial<Social>) => setSocials((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addSocial = () => setSocials((s) => [...s, { label: "", url: "" }]);
  const removeSocial = (i: number) => setSocials((s) => s.filter((_, j) => j !== i));

  const submit = async (asDraft = false) => {
    setError("");
    if (!title.trim() || !lead.trim() || !body.trim()) { setError(t("author.required")); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/author/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, lead, body, categorySlug: category, tags,
          // authorName пустой — сервер подставит реальное имя пользователя
          authorName: "",
          asDraft,
          cover: cover || undefined,
          videoUrl: videoUrl.trim() || undefined,
          socials: socials.filter((s) => s.label.trim() && s.url.trim()),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Ошибка");
      alert(asDraft ? t("author.draftSaved") : t("author.submitted"));
      router.refresh();
      setTitle(""); setLead(""); setTags(""); setBody(""); setCover(""); setSocials([{ label: "Telegram", url: "" }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <h2 className="mb-4 font-serif text-lg font-bold">{t("author.new")}</h2>
      {error && <div className="mb-4 rounded-xl border border-down/30 bg-down/5 px-4 py-3 text-sm text-down">{error}</div>}

      {/* cover upload */}
      <label className="label">{t("author.cover")}</label>
      <div className="mb-3 flex items-center gap-3">
        <label className="btn-ghost cursor-pointer text-xs">
          <Icon name="upload" size={14} /> {t("author.upload")}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0])} />
        </label>
        {cover && (
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
          <input type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={async (e) => {
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
      <p className="mb-3 text-xs text-black/40 dark:text-white/40">{t("author.videoNote")}</p>

      <label className="label">{t("author.titleField")} *</label>
      <input className="input mb-3 font-serif text-lg" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("author.titleField")} />

      <label className="label">{t("author.lead")} *</label>
      <textarea className="input mb-3 resize-y" rows={2} value={lead} onChange={(e) => setLead(e.target.value)} placeholder={t("author.lead")} />

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
        <label className="label !mb-0">{t("author.text")} *</label>
        <label className="btn-ghost cursor-pointer text-xs">
          <Icon name="image" size={14} /> {t("author.insertPhoto")}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => insertPhoto(e.target.files?.[0])} />
        </label>
      </div>
      <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} rows={10}
        className="input resize-y font-mono text-sm" placeholder="![...](...)" />

      {/* author socials */}
      <div className="mt-4">
        <label className="label">{t("author.socials")}</label>
        <div className="space-y-2">
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-32" value={s.label} onChange={(e) => setSocial(i, { label: e.target.value })} placeholder="Telegram" />
              <input className="input flex-1" value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} placeholder="https://t.me/username" />
              <button className="btn-ghost !px-3 text-xs" onClick={() => removeSocial(i)} aria-label="Удалить">×</button>
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
