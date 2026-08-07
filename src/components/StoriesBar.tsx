"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";

export default function StoriesBar() {
  const { stories, categories } = useTaxonomy();
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const catName = useCatName();
  const cat = (slug: string) => categories.find((c) => c.slug === slug);
  const story = active !== null ? stories[active] : null;

  // Куда вернуть фокус после закрытия и куда поставить при открытии.
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const open = (i: number, el: HTMLElement) => { openerRef.current = el; setActive(i); };
  const close = useCallback(() => {
    setActive(null);
    // Возврат фокуса на плитку, с которой открыли: иначе он оставался
    // в никуда и пользователь клавиатуры «терялся» на странице.
    openerRef.current?.focus();
  }, []);

  // Клавиатура в оверлее: раньше его нельзя было закрыть с клавиатуры вообще —
  // ни Escape, ни фокуса внутри, и это была ловушка.
  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft" && active > 0) setActive(active - 1);
      else if (e.key === "ArrowRight") setActive(active < stories.length - 1 ? active + 1 : null);
    };
    document.addEventListener("keydown", onKey);
    // Пока открыт оверлей, страница под ним не должна прокручиваться.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [active, stories.length, close]);

  if (!stories.length) return null;

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
        {stories.map((s, i) => (
          <button key={s.id} onClick={(e) => open(i, e.currentTarget)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span className="grid h-16 w-16 place-items-center rounded-full p-[3px]" style={{ background: `conic-gradient(${cat(s.categorySlug)?.color ?? "#14314f"}, #C81E3A, ${cat(s.categorySlug)?.color ?? "#14314f"})` }}>
              <span className="h-full w-full rounded-full bg-cover bg-center ring-2 ring-[var(--surface)] dark:ring-ink-surface" style={{ backgroundImage: `url(${s.image})` }} />
            </span>
            <span className="line-clamp-1 text-center text-[11px] text-black/70 dark:text-white/70">{cat(s.categorySlug) ? catName(cat(s.categorySlug)!) : s.title}</span>
          </button>
        ))}
      </div>

      {story && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={close}>
          {/* role=dialog + aria-modal: без них диктор продолжал читать страницу
              под оверлеем, как будто ничего не открылось */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={story.title}
            className="relative w-full max-w-sm animate-slide-up overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
              {stories.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= (active ?? 0) ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <button ref={closeRef} aria-label={t("a11y.close")} onClick={close} className="absolute right-3 top-3 z-10 text-2xl leading-none text-white">×</button>
            <div className="aspect-[9/16] w-full bg-cover bg-center" style={{ backgroundImage: `url(${story.image})` }} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5">
              <span className="chip !border-white/30 text-white">{cat(story.categorySlug) ? catName(cat(story.categorySlug)!) : ""}</span>
              <h3 className="mt-2 text-lg font-bold text-white">{story.title}</h3>
              {story.articleSlug && (
                <Link href={`/article/${story.articleSlug}`} onClick={close} className="btn-accent mt-3 w-full">
                  {t("stories.read")}
                </Link>
              )}
            </div>
            {/* Подписи через t(): раньше здесь были захардкоженные Prev/Next —
                единственные английские надписи в русском интерфейсе */}
            {active! > 0 && <button aria-label={t("a11y.prev")} onClick={() => setActive(active! - 1)} className="absolute left-0 top-0 h-full w-1/3" />}
            {/* next: on the last story, close and return to the page */}
            <button
              aria-label={active! < stories.length - 1 ? t("a11y.next") : t("a11y.close")}
              onClick={() => (active! < stories.length - 1 ? setActive(active! + 1) : close())}
              className="absolute right-0 top-0 h-full w-1/3"
            />
          </div>
        </div>
      )}
    </>
  );
}
