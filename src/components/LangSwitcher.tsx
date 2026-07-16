"use client";
import { LANGS, useI18n } from "@/lib/i18n";

export default function LangSwitcher({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex overflow-hidden rounded-lg border text-xs ${dark ? "border-white/25" : "border-black/10 dark:border-white/15"} ${className}`} role="group" aria-label="Язык">
      {LANGS.map((l) => {
        const active = lang === l.code;
        const cls = active
          ? dark ? "bg-white text-brand" : "bg-brand text-white"
          : dark ? "text-white/80 hover:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10";
        return (
          <button key={l.code} onClick={() => setLang(l.code)} aria-pressed={active} className={`px-2 py-1.5 font-semibold transition ${cls}`}>
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
