"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { DICTS, LANGS, translate, type Lang } from "./dictionaries";

export { LANGS };
export type { Lang };

function readCookieLang(): Lang | null {
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)aktiv_lang=(ru|uz|en)/) : null;
  return m ? (m[1] as Lang) : null;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const I18nContext = createContext<Ctx>({ lang: "ru", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children, initialLang = "ru" }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => {
    const saved = readCookieLang() || (localStorage.getItem("aktiv.lang") as Lang) || initialLang;
    if (saved !== lang) setLangState(saved);
    document.documentElement.lang = saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setLang = (l: Lang) => {
    localStorage.setItem("aktiv.lang", l);
    document.cookie = `aktiv_lang=${l};path=/;max-age=31536000`;
    document.documentElement.lang = l;
    setLangState(l);
    // re-render server components that read the cookie
    if (typeof window !== "undefined") window.location.reload();
  };
  const t = (k: string) => translate(lang, k) || DICTS.ru[k] || k;
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
