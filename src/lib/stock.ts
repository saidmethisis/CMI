// Котировки Республиканской фондовой биржи «Тошкент» (uzse.uz).
//
// Источник — платный API parse.bot: авторизация заголовком X-API-Key, каждый вызов
// списывает кредиты. Отсюда правила, которые важно соблюдать:
//   • кэш на сервере: один запрос на весь сайт, а не на каждого читателя, иначе
//     кредиты сгорят за часы;
//   • ключ только в переменной окружения PARSE_API_KEY, не в коде;
//   • нет ключа или API недоступен → отдаём последний удачный снимок, а если его
//     нет — пустой список. Блок тогда просто не рисуется: выдумывать котировки
//     на финансовом сайте нельзя.
//
// Если API вернёт поля под другими именами, парсер их не найдёт и блок скроется —
// это лучше, чем показать читателю неверные цены.

export interface StockQuote {
  ticker: string;      // краткий код бумаги
  name: string;        // эмитент
  close: number | null;      // цена закрытия
  last: number | null;       // цена последней сделки
  changePct: number | null;  // изменение, %
  lastDate: string;    // дата последней сделки, как отдал источник
}

const BASE = "https://api.parse.bot/scraper/17b8ba45-4e51-4e32-be43-46c04887b494";
export const SOURCE_NAME = "uzse.uz";
export const SOURCE_URL = "https://uzse.uz";

// Биржа торгует в рабочие часы; чаще раза в 15 минут обновлять смысла нет,
// а кредиты расходуются на каждый вызов.
const TTL = 15 * 60 * 1000;

type Cache = { data: StockQuote[]; updatedAt: string; fetchedAt: number };
const g = globalThis as unknown as { __stockCache?: Cache };

// Достаёт число из значения любого разумного вида: 730, "730.00", "1 234,56".
function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/\s/g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
  // Прочерк «—» или пустая ячейка после чистки дают пустую строку, а Number("")
  // — это 0. Ноль на бирже означает цену, а не отсутствие данных, поэтому без
  // цифр честно возвращаем null: в карточке будет «—», а не «0.00».
  if (!/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Берём первое непустое значение из нескольких возможных имён поля:
// у источника они могут называться по-разному (close / closePrice / yopilish...).
function pick(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const hit = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (hit && row[hit] !== null && row[hit] !== undefined && row[hit] !== "") return row[hit];
  }
  return undefined;
}

export function parseQuotes(payload: unknown): StockQuote[] {
  // Ответ может быть массивом или объектом с массивом внутри — принимаем оба.
  const rows: unknown[] = Array.isArray(payload)
    ? payload
    : (["data", "results", "items", "quotes"] as const)
        .map((k) => (payload as Record<string, unknown> | null)?.[k])
        .find(Array.isArray) as unknown[] ?? [];

  const out: StockQuote[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = String(pick(r, ["name", "issuer", "company", "short_name", "security_name"]) ?? "").trim();
    const ticker = String(pick(r, ["ticker", "symbol", "code", "isin"]) ?? "").trim();
    if (!name && !ticker) continue;
    out.push({
      ticker,
      name: name || ticker,
      close: num(pick(r, ["close", "close_price", "closing_price", "last_close", "yopilish_narxi"])),
      last: num(pick(r, ["last", "last_price", "last_deal_price", "price", "oxirgi_bitim_narxi"])),
      changePct: num(pick(r, ["change_pct", "changePercent", "change_percent", "change"])),
      lastDate: String(pick(r, ["last_date", "last_deal_date", "date", "trade_date", "oxirgi_bitim_sanasi"]) ?? ""),
    });
  }
  return out;
}

export async function getStockQuotes(): Promise<{ data: StockQuote[]; updatedAt: string; source: string }> {
  const c = g.__stockCache;
  if (c && Date.now() - c.fetchedAt < TTL) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };

  const key = process.env.PARSE_API_KEY;
  // Без ключа даже не ходим в сеть — вызов всё равно вернёт 401.
  if (!key) return { data: c?.data ?? [], updatedAt: c?.updatedAt ?? "", source: c ? SOURCE_NAME : "unavailable" };

  try {
    const res = await fetch(`${BASE}/get_stock_quotes`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error("uzse " + res.status);
    const data = parseQuotes(await res.json());
    if (data.length === 0) throw new Error("empty parse");
    const updatedAt = new Date().toISOString();
    g.__stockCache = { data, updatedAt, fetchedAt: Date.now() };
    return { data, updatedAt, source: SOURCE_NAME };
  } catch {
    // отдаём последний удачный снимок, даже просроченный; иначе честно пусто
    if (c) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };
    return { data: [], updatedAt: "", source: "unavailable" };
  }
}
