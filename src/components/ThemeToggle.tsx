"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

// Переключатель светлой и тёмной темы.
//
// Раньше это был безымянный овал с белым кружком: понять, что он делает и в
// каком состоянии находится, можно было только методом тыка. Теперь на самом
// кружке стоит значок текущей темы — солнце днём, месяц ночью, — а на
// противоположном краю бледно виден значок того, куда переключишься.
export default function ThemeToggle({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aktiv.theme", next ? "dark" : "light");
  };

  const track = onDark ? (dark ? "bg-white/50" : "bg-white/20") : dark ? "bg-brand" : "bg-black/20";
  const hint = onDark ? "text-white/55" : dark ? "text-white/50" : "text-black/35";

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? t("ui.themeLight") : t("ui.themeDark")}
      title={dark ? t("ui.themeLight") : t("ui.themeDark")}
      className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition ${track} ${className}`}
    >
      {/* Подсказка на дальнем краю: значок темы, в которую переключит нажатие. */}
      <span aria-hidden className={`pointer-events-none absolute inset-y-0 flex items-center ${dark ? "left-1" : "right-1"} ${hint}`}>
        <Icon name={dark ? "sun" : "moon"} size={13} />
      </span>

      {/* Бегунок со значком текущей темы. */}
      <span
        className={`relative grid h-5 w-5 place-items-center rounded-full bg-white shadow transition ${
          dark ? "translate-x-5 text-brand" : "text-amber-500"
        }`}
      >
        <Icon name={dark ? "moon" : "sun"} size={13} />
      </span>
    </button>
  );
}
