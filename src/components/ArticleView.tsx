"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import AdSlot from "./AdSlot";
import SaveButton from "./SaveButton";
import ShareButton from "./ShareButton";
import Icon from "./Icon";
import { Paragraphs, AiSummary, AuthorSocials } from "./ArticleBody";
import { useI18n } from "@/lib/i18n";

// Reader view — no paywall (reader content is fully open; monetization is corporate + ads).
export default function ArticleView({ a }: { a: Article }) {
  const { t, lang } = useI18n();
  const [focus, setFocus] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, p)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const listen = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(a.title + ". " + a.body);
    u.lang = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  return (
    <div className={focus ? "mx-auto max-w-[720px]" : ""}>
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-black/50 hover:underline dark:text-white/50">← {t("article.back")}</Link>
        <div className="flex items-center gap-2">
          <button onClick={listen} className="btn-ghost !px-3 !py-2 text-xs"><Icon name="listen" size={14} /> {t("article.listen")}</button>
          <button onClick={() => setFocus((v) => !v)} className={`btn-ghost !px-3 !py-2 text-xs ${focus ? "!bg-brand !text-white" : ""}`}>
            <Icon name="focus" size={14} /> {t("article.focus")}
          </button>
          <ShareButton title={a.title} slug={a.slug} />
          <SaveButton slug={a.slug} />
        </div>
      </div>

      <AiSummary text={a.aiSummary} label={t("article.aiSummary")} />

      <article>
        <Paragraphs text={a.body} />
        {!focus && <div className="my-6"><AdSlot zone="in-content" /></div>}
        <AuthorSocials socials={a.authorSocials} label={t("article.authorSocials")} />
      </article>
    </div>
  );
}
