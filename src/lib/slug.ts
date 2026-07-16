// Transliterated, URL-safe slugs (ASCII). Cyrillic slugs break routing round-trips,
// so we transliterate ru/uz Cyrillic to latin (per TZ SEO/URL requirements).
const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h", ə: "a",
};

export function slugify(input: string, maxLen = 60): string {
  const out = input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, maxLen)
    .replace(/-$/g, "");
  return out || "id";
}

export function uniqueSlug(base: string, suffix?: string | number) {
  const s = slugify(base);
  return suffix !== undefined ? `${s}-${suffix}` : s;
}
