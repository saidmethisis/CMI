"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaxonomy } from "@/lib/taxonomy";
import { uploadDataUrl } from "@/lib/upload";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
}

// Shared "add a story" widget used in both the writer and company cabinets.
// Posts to /api/stories (guarded by news.create).
export default function StoryUploader() {
  const router = useRouter();
  const { categories, refresh } = useTaxonomy();
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "tech");
  const [articleSlug, setArticleSlug] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const pick = async (f?: File) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { setError("Изображение больше 8 МБ."); return; }
    setImage(await uploadDataUrl(await fileToDataUrl(f)));
  };

  const add = async () => {
    setError(""); setMsg("");
    if (!title.trim() || !image) { setError("Нужны заголовок и изображение."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, categorySlug, image, articleSlug: articleSlug || undefined }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Ошибка");
      setTitle(""); setArticleSlug(""); setImage(""); setMsg("Стори опубликована — она появится в ленте на главной.");
      await refresh(); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
      {error && <div className="mb-2 text-xs text-down">{error}</div>}
      {msg && <div className="mb-2 text-xs text-up">{msg}</div>}
      <div className="flex items-start gap-3">
        <label className="grid h-24 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-black/20 dark:border-white/20">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-black/40 dark:text-white/40">фото</span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <div className="flex-1 space-y-2">
          <input className="input" placeholder="Заголовок стори" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="slug статьи (опц.)" value={articleSlug} onChange={(e) => setArticleSlug(e.target.value)} />
          </div>
          <button className="btn-primary w-full text-xs" disabled={busy} onClick={add}>{busy ? "Загрузка…" : "Добавить стори"}</button>
        </div>
      </div>
    </div>
  );
}
