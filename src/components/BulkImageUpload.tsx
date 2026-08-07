"use client";
import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { imageFileToUrl } from "@/lib/upload";

// Массовая загрузка изображений (ТЗ, блок 3): 5–10 штук за раз с удобным
// распределением по тексту. Раньше картинки грузились по одной, и собрать
// материал с галереей было мучением.
//
// Файлы уходят по очереди, а не все сразу: параллельная отправка десяти
// снимков с телефона забивает канал и на мобильном интернете чаще срывается,
// чем проходит. Каждый файл сжимается на клиенте (см. lib/upload).
//
// Загруженное показывается плитками. Автор отмечает нужные и вставляет их
// в текст одной кнопкой — в том порядке, в каком отмечал.
const MAX = 10;

type Item = { id: string; name: string; url?: string; error?: boolean; progress: boolean };

export default function BulkImageUpload({ onInsert, onClose }: { onInsert: (urls: string[]) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, MAX);
    if (files.length > MAX) alert(t("up.tooMany"));

    const fresh: Item[] = list.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, progress: true }));
    setItems((p) => [...p, ...fresh]);
    setBusy(true);

    for (let i = 0; i < list.length; i++) {
      const id = fresh[i].id;
      try {
        const url = await imageFileToUrl(list[i]);
        setItems((p) => p.map((x) => (x.id === id ? { ...x, url, progress: false } : x)));
        setPicked((p) => [...p, url]);
      } catch {
        setItems((p) => p.map((x) => (x.id === id ? { ...x, error: true, progress: false } : x)));
      }
    }
    setBusy(false);
  };

  const toggle = (url: string) =>
    setPicked((p) => (p.includes(url) ? p.filter((x) => x !== url) : [...p, url]));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t("up.title")}>
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-serif text-xl font-bold">{t("up.title")}</h2>
          <button type="button" onClick={onClose} className="ml-auto btn-ghost text-sm">{t("a11y.close")}</button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
          className="grid place-items-center gap-2 rounded-xl border-2 border-dashed border-black/15 p-6 text-center dark:border-white/20"
        >
          <p className="text-sm text-black/60 dark:text-white/65">{t("up.hint")}</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost text-sm">{t("up.pick")}</button>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
        </div>

        {items.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => it.url && toggle(it.url)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                  it.url && picked.includes(it.url) ? "border-accent" : "border-transparent"
                }`}
              >
                {it.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={it.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-black/5 px-1 text-center text-[11px] text-black/60 dark:bg-white/10 dark:text-white/65">
                    {it.error ? t("up.failed") : `${t("up.uploading")}…`}
                  </span>
                )}
                {it.url && picked.includes(it.url) && (
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {picked.indexOf(it.url) + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy || picked.length === 0}
            onClick={() => { onInsert(picked); onClose(); }}
            className="btn bg-brand text-white disabled:opacity-50"
          >
            {t("up.insert")}{picked.length ? ` (${picked.length})` : ""}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">{t("up.cancel")}</button>
        </div>
      </div>
    </div>
  );
}
