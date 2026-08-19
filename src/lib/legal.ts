import type { LangCode } from "@/lib/types";

// Даты последней редакции правовых документов.
//
// Раньше на страницах стояла заглушка «__.__.2026» — читатель видел её вместо
// даты, а для документа, который регулирует обработку его данных, это первое,
// на что смотрят. Дату держим здесь отдельной строкой, а не берём из времени
// изменения файла: файл меняется от любой правки вёрстки, а редакция документа
// — только когда переписан текст.
//
// ВАЖНО: правите текст политики или условий — обновите дату здесь же.
export const LEGAL_REVISED = {
  // добавлен абзац о счётчике посещаемости и записи действий
  privacy: "2026-08-14",
  // последняя правка текста условий
  terms: "2026-08-03",
} as const;

const LOCALE: Record<LangCode, string> = { ru: "ru-RU", uz: "uz-UZ", en: "en-US" };

/** «14 августа 2026 г.» / «14-avgust, 2026» / «August 14, 2026» */
export function formatLegalDate(iso: string, lang: LangCode): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(LOCALE[lang] ?? "ru-RU", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
