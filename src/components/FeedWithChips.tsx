"use client";
import { useMemo, useState } from "react";
import type { Article } from "@/lib/types";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import ScrollRow from "./ScrollRow";
import Feed from "./Feed";

// Лента с фильтром по рубрикам: клик по чипу переключает выборку НА МЕСТЕ,
// без перехода на страницу категории.
export default function FeedWithChips({ items }: { items: Article[] }) {
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t } = useI18n();
  const [active, setActive] = useState<string>("all");

  // показываем только рубрики, у которых реально есть материалы в этой ленте
  const present = useMemo(() => new Set(items.map((a) => a.categorySlug)), [items]);
  const chips = categories.filter((c) => present.has(c.slug));

  const filtered = active === "all" ? items : items.filter((a) => a.categorySlug === active);
  const chipBase = "chip shrink-0 cursor-pointer transition";

  return (
    <>
      <div className="mb-4">
        <ScrollRow gap="gap-2" className="-mx-4 items-center px-4 py-1 sm:mx-0 sm:px-0 md:pr-16">
          <button onClick={() => setActive("all")} className={`${chipBase} ${active === "all" ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{t("home.all")}</button>
          {chips.map((c) => (
            <button key={c.slug} onClick={() => setActive(c.slug)} className={`${chipBase} ${active === c.slug ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{catName(c)}</button>
          ))}
        </ScrollRow>
      </div>
      {/* key=active — сбрасывает выборку к началу при смене рубрики. На главной: 11 сразу (ровно 4 ряда по 3 с учётом широкой первой карточки и рекламы), потом по 9 */}
      <Feed key={active} items={filtered} initial={11} step={9} />
    </>
  );
}
