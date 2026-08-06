// Курсы покупки/продажи валюты в коммерческих банках Узбекистана.
//
// Источник — агрегатор bank.uz. Публичного API у него нет, поэтому читаем публичную
// страницу и разбираем разметку. Отсюда следуют правила, которые важно соблюдать:
//   • кэш на час и один общий запрос на весь сайт (не бьём источник на каждого читателя);
//   • честный User-Agent с контактом — чтобы нас можно было опознать в их логах;
//   • в UI обязательна видимая ссылка «Источник: bank.uz» (см. BankRates.tsx);
//   • при любой ошибке отдаём последний удачный снимок, а если его нет — пустой список
//     с source: "unavailable". Никаких выдуманных чисел: пустой блок лучше неверных курсов.
// Если разметка bank.uz изменится, парсер вернёт 0 строк — блок просто скроется.

export interface BankRate {
  bank: string;
  slug: string;
  url: string;
  buy: number;
  sell: number;
}
export type BankRatesByCode = Record<string, BankRate[]>;

export const BANK_CODES = ["USD", "RUB", "EUR", "GBP", "KZT"] as const;
export type BankCode = (typeof BANK_CODES)[number];

const SRC_URL = "https://bank.uz/currency";
export const SOURCE_NAME = "bank.uz";
export const SOURCE_URL = SRC_URL;

const TTL = 60 * 60 * 1000; // 1 час
const UA = "Mozilla/5.0 (compatible; AsosiyAktivBot/1.0; +https://asosiy.net)";

// <a href="/currency/bank/SLUG"><span class="medium-text">Название</span></a></div>
// <span class="medium-text green-date">12 050 сум</span>
const ENTRY_RE =
  /\/currency\/bank\/([^"]+)"[^>]*>\s*<span class="medium-text">\s*([^<]+?)\s*<\/span>\s*<\/a>\s*<\/div>\s*<span class="[^"]*">\s*([\d\s]+?)\s*сум/g;

type Cache = { data: BankRatesByCode; updatedAt: string; fetchedAt: number };
const g = globalThis as unknown as { __bankRatesCache?: Cache };

// Вырезает панель одной валюты: от её якоря до начала следующей панели.
function panelFor(html: string, code: string): string | null {
  const start = html.indexOf(`id="best_${code}"`);
  if (start < 0) return null;
  let end = html.length;
  for (const c of BANK_CODES) {
    const i = html.indexOf(`id="best_${c}"`);
    if (i > start && i < end) end = i;
  }
  return html.slice(start, end);
}

function entriesIn(chunk: string): { slug: string; bank: string; value: number }[] {
  const out: { slug: string; bank: string; value: number }[] = [];
  ENTRY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_RE.exec(chunk))) {
    const value = Number(m[3].replace(/\s/g, ""));
    if (Number.isFinite(value) && value > 0) out.push({ slug: m[1], bank: m[2].trim(), value });
  }
  return out;
}

export function parseBankRates(html: string): BankRatesByCode {
  const result: BankRatesByCode = {};
  for (const code of BANK_CODES) {
    const panel = panelFor(html, code);
    if (!panel) continue;
    // внутри панели сначала блок «Покупка», затем «Продажа»; списки отсортированы
    // по-разному, поэтому склеиваем их по slug банка, а не по позиции.
    const iBuy = panel.indexOf("Покупка");
    const iSell = panel.indexOf("Продажа");
    if (iBuy < 0 || iSell < 0 || iSell < iBuy) continue;
    const map = new Map<string, BankRate>();
    for (const b of entriesIn(panel.slice(iBuy, iSell))) {
      map.set(b.slug, { bank: b.bank, slug: b.slug, url: `https://bank.uz/currency/bank/${b.slug}`, buy: b.value, sell: 0 });
    }
    for (const s of entriesIn(panel.slice(iSell))) {
      const e = map.get(s.slug) ?? { bank: s.bank, slug: s.slug, url: `https://bank.uz/currency/bank/${s.slug}`, buy: 0, sell: 0 };
      e.sell = s.value;
      map.set(s.slug, e);
    }
    const rows = [...map.values()].filter((r) => r.buy > 0 && r.sell > 0).sort((a, b) => b.buy - a.buy);
    if (rows.length) result[code] = rows;
  }
  return result;
}

export async function getBankRates(): Promise<{ data: BankRatesByCode; updatedAt: string; source: string }> {
  const c = g.__bankRatesCache;
  if (c && Date.now() - c.fetchedAt < TTL) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };

  try {
    const res = await fetch(SRC_URL, {
      headers: { "User-Agent": UA, "Accept-Language": "ru" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error("bank.uz " + res.status);
    const data = parseBankRates(await res.text());
    if (Object.keys(data).length === 0) throw new Error("empty parse");
    const updatedAt = new Date().toISOString();
    g.__bankRatesCache = { data, updatedAt, fetchedAt: Date.now() };
    return { data, updatedAt, source: SOURCE_NAME };
  } catch {
    // отдаём последний удачный снимок, даже просроченный; иначе — честно пусто
    if (c) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };
    return { data: {}, updatedAt: "", source: "unavailable" };
  }
}
