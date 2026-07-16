"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import AdSlot from "./AdSlot";
import { useI18n } from "@/lib/i18n";

type Item = { slug: string; title: string; createdAt: string };

// vaqt.uz-style chronological left rail with "Лента / Срочные" tabs.
export default function NewsTimeline({ items }: { items: Item[] }) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [tab, setTab] = useState<"feed" | "urgent">("feed");
  const list = (tab === "urgent" ? items.slice(0, 5) : items).slice(0, 14);

  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    return {
      time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      day: sameDay ? t("timeline.today") : d.toLocaleDateString(loc, { day: "numeric", month: "short" }),
    };
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-[var(--surface)] dark:border-white/10 dark:bg-ink-surface">
      {/* tabs */}
      <div className="flex gap-1 border-b border-black/5 p-2 dark:border-white/10">
        <button onClick={() => setTab("feed")} className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition ${tab === "feed" ? "bg-brand text-white" : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10"}`}>{t("timeline.feed")}</button>
        <button onClick={() => setTab("urgent")} className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition ${tab === "urgent" ? "bg-accent text-white" : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10"}`}>{t("timeline.urgent")}</button>
      </div>

      <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
        {list.map((a, i) => {
          const { time, day } = timeLabel(a.createdAt);
          return (
            <Fragment key={a.slug}>
              <li>
                <Link href={`/article/${a.slug}`} className="flex gap-3 px-3 py-2.5 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                  <span className="flex w-11 shrink-0 flex-col items-center border-r border-black/[0.06] pr-2 text-center dark:border-white/[0.08]">
                    <span className="text-sm font-bold tabular-nums text-brand dark:text-white">{time}</span>
                    <span className="text-[10px] text-black/40 dark:text-white/40">{day}</span>
                  </span>
                  <span className="line-clamp-3 text-sm leading-snug hover:text-accent">{a.title}</span>
                </Link>
              </li>
              {i === 4 && (
                <li className="p-2"><AdSlot native /></li>
              )}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
