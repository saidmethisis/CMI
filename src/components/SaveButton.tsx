"use client";
import { useSaved } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

export default function SaveButton({ slug, className = "" }: { slug: string; className?: string }) {
  const [saved, toggle] = useSaved();
  const { t } = useI18n();
  const isSaved = saved.includes(slug);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-pressed={isSaved}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${isSaved ? "border-brand bg-brand text-white" : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"} ${className}`}
    >
      {isSaved ? t("common.saved") : t("common.save")}
    </button>
  );
}
