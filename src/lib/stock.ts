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
// Формат ответа (проверено на живом ключе, 144 бумаги):
//   { status: "success",
//     data: { total_quotes, quotes: [ { ticker, company, security_code,
//             closing_price, last_trade_price, change_direction, change_value,
//             last_trade_date } ], recent_trades: [...] } }
//
// Изменение показываем ровно так, как отдаёт биржа: направление и величину.
// Считать проценты самим нельзя — `change_value` не сходится с разницей между
// ценой закрытия и последней сделкой, значит это изменение к другой базе.
// Выдуманный процент на финансовой странице хуже, чем никакого.

export interface StockQuote {
  ticker: string;            // краткий код бумаги
  name: string;              // эмитент
  close: number | null;      // цена закрытия
  last: number | null;       // цена последней сделки
  change: number | null;     // величина изменения, как отдал источник
  direction: "up" | "down" | null;
  lastDate: string;          // дата последней сделки, как отдал источник
}

const BASE = "https://api.parse.bot/scraper/17b8ba45-4e51-4e32-be43-46c04887b494";
export const SOURCE_NAME = "uzse.uz";
export const SOURCE_URL = "https://uzse.uz";

// Биржа торгует в рабочие часы; чаще раза в 15 минут обновлять смысла нет,
// а кредиты расходуются на каждый вызов.
// Как долго держим снимок котировок.
//
// Было 15 минут — это 96 обращений к источнику в сутки при его лимите в 100,
// плюс по одному на каждый перезапуск контейнера. Квота выбиралась досуха, и
// биржа на сайте пропадала: источник отвечал «daily limit exceeded», а блок
// котировок просто не отрисовывался.
//
// Час даёт 24 обращения в сутки — с запасом на выкладки и ручные проверки.
// Чаще и не нужно: источник отдаёт цены закрытия и дату последней сделки,
// они меняются раз в торговый день, а не каждые четверть часа.
const TTL = 60 * 60 * 1000;

// Сколько бумаг показываем. В ответе их полторы сотни — все в карусель не нужны,
// а тянуть их в браузер значит раздувать страницу ради того, что никто не листает.
const SHOW = 24;

type Cache = { data: StockQuote[]; updatedAt: string; fetchedAt: number };
// mutedUntil — до какого момента источник просил не беспокоить.
const g = globalThis as unknown as { __stockCache?: Cache; __stockMutedUntil?: number };

/**
 * Число из строки биржи. Разделители тут смешанные, и ошибка стоит дорого:
 * «16,100» — это шестнадцать тысяч сто, а не шестнадцать с небольшим.
 *
 * Правило: если разделитель один и по всей строке за ним ровно три цифры —
 * это тысячи. Если разделителей два, десятичным считается последний.
 */
export function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;

  let s = v.replace(/[\s  ]/g, "");
  if (!/\d/.test(s)) return null; // «—», пустая ячейка: это отсутствие цены, а не ноль

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thou = dec === "," ? "." : ",";
    s = s.split(thou).join("").replace(dec, ".");
  } else if (hasComma) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.split(",").join("") : s.replace(",", ".");
  } else if (hasDot) {
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.split(".").join("");
  }

  s = s.replace(/[^\d.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Берём первое непустое значение из нескольких возможных имён поля: у источника
// они могут смениться, и лучше пережить это, чем показать пустую карточку.
function pick(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const hit = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (hit && row[hit] !== null && row[hit] !== undefined && row[hit] !== "") return row[hit];
  }
  return undefined;
}

// Массив котировок лежит в data.quotes. Ищем и по вложенному пути, и по
// нескольким запасным именам — формат у поставщика уже менялся один раз.
function findRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = payload as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") return [];

  const nested = obj.data as Record<string, unknown> | undefined;
  for (const src of [nested, obj]) {
    if (!src || typeof src !== "object") continue;
    for (const k of ["quotes", "data", "results", "items"]) {
      const v = (src as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export function parseQuotes(payload: unknown): StockQuote[] {
  const out: StockQuote[] = [];
  for (const raw of findRows(payload)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = String(pick(r, ["company", "name", "issuer", "short_name", "security_name"]) ?? "").trim();
    const ticker = String(pick(r, ["ticker", "symbol", "code"]) ?? "").trim();
    if (!name && !ticker) continue;

    const dir = String(pick(r, ["change_direction", "direction"]) ?? "").toLowerCase();
    out.push({
      ticker,
      // Эмитенты приходят в угловых скобках: «<Olmaliq KMK> AJ». Меняем на
      // кавычки: угловые скобки в тексте выглядят как обрывок разметки.
      name: (name || ticker).replace(/[<>]/g, (m) => (m === "<" ? "«" : "»")),
      close: num(pick(r, ["closing_price", "close", "close_price", "last_close"])),
      last: num(pick(r, ["last_trade_price", "last_price", "last", "last_deal_price", "price"])),
      change: num(pick(r, ["change_value", "change", "change_amount"])),
      direction: dir === "up" ? "up" : dir === "down" ? "down" : null,
      lastDate: String(pick(r, ["last_trade_date", "last_date", "trade_date", "date"]) ?? "").trim(),
    });
  }
  // Сначала те, по кому вообще были сделки: карточка без цены читателю не нужна.
  return out.sort((a, b) => Number(b.last !== null) - Number(a.last !== null)).slice(0, SHOW);
}

export async function getStockQuotes(): Promise<{ data: StockQuote[]; updatedAt: string; source: string }> {
  const c = g.__stockCache;
  if (c && Date.now() - c.fetchedAt < TTL) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };

  const key = process.env.PARSE_API_KEY;
  // Без ключа даже не ходим в сеть — вызов всё равно вернёт 401.
  if (!key) return { data: c?.data ?? [], updatedAt: c?.updatedAt ?? "", source: c ? SOURCE_NAME : "unavailable" };

  // Источник сказал «лимит исчерпан, вернись через столько-то» — молчим до
  // этого срока. Раньше мы продолжали стучаться на каждый заход читателя:
  // сотни заведомо отказных запросов в час, которые сами же и удерживали
  // счётчик у потолка. Отказ надо уважать, а не переспрашивать.
  if (g.__stockMutedUntil && Date.now() < g.__stockMutedUntil) {
    return c
      ? { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME }
      : { data: [], updatedAt: "", source: "unavailable" };
  }

  try {
    const res = await fetch(`${BASE}/get_stock_quotes`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      // Совпадает с TTL выше: иначе кэш Next сходил бы за данными по своему счёту.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      // 429 — суточный лимит, 402 — кончился тариф. В обоих случаях источник
      // называет, через сколько секунд возвращаться; берём это число, а при
      // его отсутствии молчим час.
      if (res.status === 429 || res.status === 402) {
        let wait = 3600;
        try {
          const body = (await res.clone().json()) as { error?: { retry_after?: number } };
          const ra = body?.error?.retry_after;
          if (typeof ra === "number" && ra > 0) wait = Math.min(ra, 24 * 3600);
        } catch {
          const h = Number(res.headers.get("retry-after"));
          if (Number.isFinite(h) && h > 0) wait = Math.min(h, 24 * 3600);
        }
        g.__stockMutedUntil = Date.now() + wait * 1000;
        console.error(`Котировки биржи: источник просит подождать ${Math.round(wait / 60)} мин — до тех пор не беспокоим`);
        return c
          ? { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME }
          : { data: [], updatedAt: "", source: "unavailable" };
      }
      throw new Error("uzse " + res.status);
    }
    const data = parseQuotes(await res.json());
    if (data.length === 0) throw new Error("empty parse");
    const updatedAt = new Date().toISOString();
    g.__stockCache = { data, updatedAt, fetchedAt: Date.now() };
    g.__stockMutedUntil = undefined;
    return { data, updatedAt, source: SOURCE_NAME };
  } catch (e) {
    console.error("Котировки биржи не получены —", (e as Error).message);
    // отдаём последний удачный снимок, даже просроченный; иначе честно пусто
    if (c) return { data: c.data, updatedAt: c.updatedAt, source: SOURCE_NAME };
    return { data: [], updatedAt: "", source: "unavailable" };
  }
}
