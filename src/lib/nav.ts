// Mega-menu subsections per category (Fox-Business-style dropdowns), localized.
import type { Lang } from "./dictionaries";

const SUBS: Record<Lang, Record<string, string[]>> = {
  ru: {
    finance: ["Ипотека", "Кредиты", "Карты", "Депозиты", "Страхование", "Пенсии", "Налоги"],
    markets: ["Акции", "Индексы", "Крипта", "Валюты", "Товары", "Облигации", "ETF"],
    economy: ["Макро", "Инфляция", "Занятость", "ВВП", "Торговля"],
    business: ["Компании", "Ритейл", "МСБ", "Индустрия", "Лидеры"],
    tech: ["AI", "Стартапы", "Гаджеты", "Кибербезопасность", "Облака"],
    startups: ["Раунды", "Венчур", "Питчи", "Единороги"],
    politics: ["Власть", "Регион", "Выборы", "Законы"],
    diplomacy: ["Саммиты", "Договоры", "Санкции", "Регион"],
  },
  en: {
    finance: ["Mortgage", "Loans", "Cards", "Deposits", "Insurance", "Pensions", "Taxes"],
    markets: ["Stocks", "Indices", "Crypto", "Currencies", "Commodities", "Bonds", "ETF"],
    economy: ["Macro", "Inflation", "Employment", "GDP", "Trade"],
    business: ["Companies", "Retail", "SME", "Industry", "Leaders"],
    tech: ["AI", "Startups", "Gadgets", "Cybersecurity", "Cloud"],
    startups: ["Rounds", "Venture", "Pitches", "Unicorns"],
    politics: ["Government", "Region", "Elections", "Laws"],
    diplomacy: ["Summits", "Treaties", "Sanctions", "Region"],
  },
  uz: {
    finance: ["Ipoteka", "Kreditlar", "Kartalar", "Depozitlar", "Sug'urta", "Pensiyalar", "Soliqlar"],
    markets: ["Aksiyalar", "Indekslar", "Kripto", "Valyutalar", "Tovarlar", "Obligatsiyalar", "ETF"],
    economy: ["Makro", "Inflyatsiya", "Bandlik", "YaIM", "Savdo"],
    business: ["Kompaniyalar", "Riteyl", "KOB", "Sanoat", "Liderlar"],
    tech: ["AI", "Startaplar", "Gadjetlar", "Kiberxavfsizlik", "Bulut"],
    startups: ["Raundlar", "Venchur", "Pitchlar", "Unicorns"],
    politics: ["Hokimiyat", "Mintaqa", "Saylovlar", "Qonunlar"],
    diplomacy: ["Sammitlar", "Shartnomalar", "Sanksiyalar", "Mintaqa"],
  },
};

export function subsectionsFor(lang: Lang): Record<string, string[]> {
  return SUBS[lang] ?? SUBS.ru;
}

// Пара «значение для фильтра» + «подпись на языке интерфейса».
//
// Фильтр ищет по тексту статей, а статьи пишутся на своём языке — поэтому
// в ссылку идёт КАНОНИЧЕСКОЕ русское значение, а пользователю показывается перевод.
// Раньше в запрос уходила переведённая подпись («Mortgage»), и на английском
// интерфейсе все чипы подрубрик не находили ничего.
export type Subsection = { value: string; label: string };
export function subsectionPairs(lang: Lang, categorySlug: string): Subsection[] {
  const ru = SUBS.ru[categorySlug] ?? [];
  const loc = (SUBS[lang] ?? SUBS.ru)[categorySlug] ?? [];
  return ru.map((value, i) => ({ value, label: loc[i] ?? value }));
}

// Обратная совместимость (RU по умолчанию).
export const subsections = SUBS.ru;
