"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Шеринг статьи: нативный share (моб.), копирование ссылки и соцсети. Без иконок — текст.
export default function ShareButton({ title, slug }: { title: string; slug: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const url = () => `${window.location.origin}/article/${slug}`;

  const onClick = async () => {
    // на мобильных с системным share — сразу нативный лист
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url: url() }); return; } catch { /* отменили — покажем меню */ }
    }
    setOpen((o) => !o);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const ext = (href: string) => { window.open(href, "_blank", "noopener,noreferrer"); setOpen(false); };

  const item = "block w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]";
  return (
    <div className="relative" ref={ref}>
      <button onClick={onClick} className="btn-ghost !px-3 !py-2 text-xs">{t("article.share")}</button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-black/10 bg-[var(--surface,#fff)] py-1 shadow-lg dark:border-white/15 dark:bg-[#151a22]">
          <button className={item} onClick={copy}>{copied ? t("article.copied") : t("article.copyLink")}</button>
          <button className={item} onClick={() => ext(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`)}>Telegram</button>
          <button className={item} onClick={() => ext(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`)}>X (Twitter)</button>
          <button className={item} onClick={() => ext(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>Facebook</button>
        </div>
      )}
    </div>
  );
}
