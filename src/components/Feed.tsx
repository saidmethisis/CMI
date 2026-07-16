"use client";
import { Fragment, useState } from "react";
import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";
import AdSlot from "./AdSlot";
import { useI18n } from "@/lib/i18n";

// Показывает `initial` статей; по кнопке «Смотреть ещё» добавляет ещё `step`.
export default function Feed({ items, initial = 8, step = 9 }: { items: Article[]; initial?: number; step?: number }) {
  const { t } = useI18n();
  const [count, setCount] = useState(initial);

  const visible = items.slice(0, count);
  const remaining = items.length - count;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a, i) => (
          <Fragment key={a.id}>
            <ArticleCard a={a} variant={i === 0 ? "L" : "M"} />
            {/* ad between the 5th and 6th article */}
            {i === 4 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <AdSlot native />
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {remaining > 0 ? (
        <div className="flex justify-center py-6">
          <button
            onClick={() => setCount((c) => Math.min(c + step, items.length))}
            className="rounded-full border border-brand/30 bg-brand/5 px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white/15"
          >
            {t("feed.more")}
          </button>
        </div>
      ) : (
        items.length > initial && (
          <div className="py-6">
            {/* ad at the end of the feed */}
            <AdSlot native />
            <p className="py-8 text-center text-sm text-black/40 dark:text-white/40">{t("feed.end")}</p>
          </div>
        )
      )}
    </>
  );
}
