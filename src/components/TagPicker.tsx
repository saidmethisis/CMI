"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { TAG_GROUPS, tagLabel, isKnownTag } from "@/lib/tags";

// Выбор тегов из справочника вместо свободного ввода.
//
// Автор отмечает нужные — в материал попадают их коды, а подпись читатель видит
// на своём языке. Раньше теги вводились руками и на одном языке: под узбекской
// статьёй висело «#экспорт», а «#eksport» и «#export» были для системы тремя
// разными тегами, между собой не связанными.
//
// Значение наружу — строка с кодами через запятую: так же, как раньше, поэтому
// сохранение и уже написанные статьи не меняются.
export default function TagPicker({ value, onChange, max = 8 }: { value: string; onChange: (v: string) => void; max?: number }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const picked = value.split(",").map((s) => s.trim()).filter(Boolean);
  const set = (list: string[]) => onChange(list.join(", "));

  const toggle = (slug: string) => {
    if (picked.includes(slug)) set(picked.filter((s) => s !== slug));
    else if (picked.length < max) set([...picked, slug]);
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {picked.length === 0 && <span className="text-sm text-black/45 dark:text-white/45">{t("tag.none")}</span>}
        {picked.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            className={`chip ${isKnownTag(slug) ? "!border-accent/40 text-accent" : "!border-amber-400/50 text-amber-600 dark:text-amber-400"}`}
            title={isKnownTag(slug) ? t("tag.remove") : t("tag.unknown")}
          >
            {tagLabel(slug, lang)} ×
          </button>
        ))}
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost text-xs">
          {open ? t("a11y.close") : t("tag.add")}
        </button>
        <span className="text-xs text-black/45 dark:text-white/45">{picked.length}/{max}</span>
      </div>

      {open && (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-black/10 p-3 dark:border-white/15">
          {TAG_GROUPS.map((g) => (
            <div key={g.title.ru} className="mb-3 last:mb-0">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-black/45 dark:text-white/45">
                {g.title[lang] ?? g.title.ru}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.slugs.map((slug) => {
                  const on = picked.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggle(slug)}
                      disabled={!on && picked.length >= max}
                      className={`chip text-xs ${on ? "!border-accent bg-accent/10 text-accent" : "hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"}`}
                    >
                      {tagLabel(slug, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
