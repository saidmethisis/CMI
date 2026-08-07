"use client";
// Небольшая честная пометка «демо» для блоков с иллюстративными (не реальными) данными.
// Без иконок — только текст.
import { useI18n } from "@/lib/i18n";

export default function DemoBadge({ title }: { title?: string }) {
  const { t } = useI18n();
  return (
    <span
      title={title ?? t("misc.demoTitle")}
      className="ml-2 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
    >
      {t("misc.demo")}
    </span>
  );
}
