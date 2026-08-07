"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Редактор текста статьи (ТЗ, блок 2): форматирование, размеры шрифта,
// выравнивание, списки, цитаты, ссылки и картинки.
//
// Почему свой, а не готовая библиотека. В задании прямым текстом: «сайт должен
// быть легковесным, мгновенно загружаться». Готовый редактор — это ProseMirror
// на две-три сотни килобайт. Здесь тот же набор возможностей делает браузер:
// contenteditable умеет форматировать текст сам, нам остаётся панель кнопок и
// строгая уборка за ним.
//
// Что на выходе. Обычный HTML из короткого списка тегов. Он проходит через
// санитайзер на сервере при сохранении и ещё раз при выводе — редактор не
// является границей доверия, он лишь удобство для автора.

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Кнопка массовой загрузки картинок: получает готовые адреса. */
  onRequestImages?: (insert: (urls: string[]) => void) => void;
  className?: string;
};

type Cmd = { id: string; label: string; title: string; run: (e: HTMLElement) => void; wide?: boolean };

// document.execCommand объявлен устаревшим, но заменой так и не обзавёлся:
// это единственный способ форматировать выделение без своей модели документа.
// Поддерживается всеми браузерами и, по заявлению разработчиков Chrome,
// удалён не будет из-за объёма зависящего кода.
const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);

export default function RichEditor({ value, onChange, placeholder, onRequestImages, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [dirty, setDirty] = useState(false);

  // Значение снаружи подставляем только когда поле не редактируется: иначе
  // React на каждом нажатии переписывал бы содержимое и курсор прыгал в начало.
  useEffect(() => {
    const el = ref.current;
    if (!el || dirty) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value, dirty]);

  const push = useCallback(() => {
    const el = ref.current;
    if (el) onChange(el.innerHTML);
  }, [onChange]);

  const apply = (fn: () => void) => {
    ref.current?.focus();
    fn();
    push();
  };

  // Вставка чужого текста тянет за собой шрифты, цвета и разметку с чужого
  // сайта. Берём только текст — оформление задаёт наш редактор.
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    exec("insertText", text);
    push();
  };

  const block = (tag: string) => apply(() => exec("formatBlock", tag));
  const align = (cls: string) =>
    apply(() => {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const el = (node?.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null;
      const b = el?.closest("p,h2,h3,li,blockquote") as HTMLElement | null;
      if (!b) return;
      b.classList.remove("ta-left", "ta-center", "ta-right");
      if (cls) b.classList.add(cls);
    });
  const size = (cls: string) =>
    apply(() => {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const el = (node?.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null;
      const b = el?.closest("p,h2,h3,li,blockquote") as HTMLElement | null;
      if (!b) return;
      b.classList.remove("fs-sm", "fs-lg", "fs-xl");
      if (cls) b.classList.add(cls);
    });

  const link = () =>
    apply(() => {
      const url = window.prompt(t("ed.linkPrompt"), "https://");
      if (!url) return;
      if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) { alert(t("ed.linkBad")); return; }
      exec("createLink", url);
      // execCommand не умеет ставить target/rel — дописываем сами.
      ref.current?.querySelectorAll('a[href^="http"]').forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer nofollow");
      });
    });

  const insertImages = (urls: string[]) =>
    apply(() => {
      for (const u of urls) exec("insertHTML", `<figure><img src="${u}" alt="" loading="lazy"><figcaption></figcaption></figure><p><br></p>`);
    });

  const GROUPS: Cmd[][] = [
    [
      { id: "bold", label: "Ж", title: t("ed.bold"), run: () => exec("bold") },
      { id: "italic", label: "К", title: t("ed.italic"), run: () => exec("italic") },
      { id: "underline", label: "Ч", title: t("ed.underline"), run: () => exec("underline") },
      { id: "strike", label: "S", title: t("ed.strike"), run: () => exec("strikeThrough") },
    ],
    [
      { id: "h2", label: "H2", title: t("ed.h2"), run: () => block("h2") },
      { id: "h3", label: "H3", title: t("ed.h3"), run: () => block("h3") },
      { id: "p", label: "¶", title: t("ed.paragraph"), run: () => block("p") },
    ],
    [
      { id: "fs-sm", label: "A−", title: t("ed.small"), run: () => size("fs-sm") },
      { id: "fs-none", label: "A", title: t("ed.normal"), run: () => size("") },
      { id: "fs-lg", label: "A+", title: t("ed.large"), run: () => size("fs-lg") },
      { id: "fs-xl", label: "A++", title: t("ed.huge"), run: () => size("fs-xl") },
    ],
    [
      { id: "left", label: "◧", title: t("ed.alignLeft"), run: () => align("") },
      { id: "center", label: "◫", title: t("ed.alignCenter"), run: () => align("ta-center") },
      { id: "right", label: "◨", title: t("ed.alignRight"), run: () => align("ta-right") },
    ],
    [
      { id: "ul", label: "•—", title: t("ed.bullets"), run: () => exec("insertUnorderedList") },
      { id: "ol", label: "1—", title: t("ed.numbers"), run: () => exec("insertOrderedList") },
      { id: "quote", label: "❝", title: t("ed.quote"), run: () => block("blockquote") },
    ],
    [
      { id: "link", label: t("ed.link"), title: t("ed.link"), run: () => link(), wide: true },
      { id: "unlink", label: t("ed.unlink"), title: t("ed.unlink"), run: () => exec("unlink"), wide: true },
      { id: "clear", label: t("ed.clear"), title: t("ed.clear"), run: () => exec("removeFormat"), wide: true },
    ],
  ];

  return (
    <div className={`rounded-xl border border-black/10 dark:border-white/15 ${className}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 p-1.5 dark:border-white/15">
        {GROUPS.map((g, gi) => (
          <span key={gi} className="flex items-center gap-0.5 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-black/10 [&:not(:last-child)]:pr-1.5 dark:[&:not(:last-child)]:border-white/15">
            {g.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.title}
                aria-label={c.title}
                // mousedown вместо click: click срабатывает после того, как поле
                // потеряет фокус, и выделение к тому моменту уже сброшено.
                onMouseDown={(e) => { e.preventDefault(); apply(() => c.run(ref.current!)); }}
                className={`rounded-md px-2 py-1 text-xs font-bold text-black/70 hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10 ${c.wide ? "" : "min-w-[30px]"}`}
              >
                {c.label}
              </button>
            ))}
          </span>
        ))}
        {onRequestImages && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onRequestImages(insertImages); }}
            className="ml-auto rounded-md bg-brand px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-500"
          >
            {t("ed.images")}
          </button>
        )}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={() => { setDirty(true); push(); }}
        onBlur={() => { setDirty(false); push(); }}
        onPaste={onPaste}
        className="rich-editor min-h-[320px] w-full px-4 py-3 text-[15px] leading-relaxed outline-none"
      />
    </div>
  );
}
