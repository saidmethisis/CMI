"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

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

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? t("ui.themeLight") : t("ui.themeDark")}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${track} ${className}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${dark ? "translate-x-5" : ""}`} />
    </button>
  );
}
