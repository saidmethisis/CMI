// Currency rates from the Central Bank of Uzbekistan (cbu.uz), cached with fallback.
// Architecture: add a currency by extending WANT; the fetch/cache/fallback stays the same.

export interface Rate {
  code: string;
  name: string;
  rate: number; // UZS per 1 unit
  diff: number; // daily change (UZS)
  flag: string; // ISO country for optional client flag mapping (no emoji)
}

export const WANT: { code: string; name: string; flag: string }[] = [
  { code: "USD", name: "Доллар США", flag: "US" },
  { code: "EUR", name: "Евро", flag: "EU" },
  { code: "RUB", name: "Рубль", flag: "RU" },
  { code: "GBP", name: "Фунт стерлингов", flag: "GB" },
  { code: "CNY", name: "Юань", flag: "CN" },
  { code: "KZT", name: "Тенге", flag: "KZ" },
  { code: "TRY", name: "Турецкая лира", flag: "TR" },
  { code: "AED", name: "Дирхам ОАЭ", flag: "AE" },
  { code: "JPY", name: "Иена", flag: "JP" },
  { code: "KRW", name: "Вона", flag: "KR" },
];

// last-known snapshot used only when every source is unreachable
const FALLBACK: Record<string, number> = {
  USD: 12676, EUR: 13800, RUB: 157, GBP: 16100, CNY: 1740, KZT: 24.5, TRY: 360, AED: 3450, JPY: 80, KRW: 9,
};

const CBU_URL = "https://cbu.uz/uz/arkhiv-kursov-valyut/json/";
const TTL = 60 * 60 * 1000; // 1 hour cache

type Cache = { data: Rate[]; updatedAt: string; source: "cbu" | "fallback"; fetchedAt: number };
const g = globalThis as unknown as { __ratesCache?: Cache };

export async function getRates(): Promise<{ data: Rate[]; updatedAt: string; source: string }> {
  const c = g.__ratesCache;
  if (c && Date.now() - c.fetchedAt < TTL) return { data: c.data, updatedAt: c.updatedAt, source: c.source };

  // primary source: CBU
  try {
    const res = await fetch(CBU_URL, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("cbu " + res.status);
    const raw = (await res.json()) as { Ccy: string; Rate: string; Diff: string; Nominal: string; Date: string }[];
    const byCode = new Map(raw.map((r) => [r.Ccy, r]));
    const data: Rate[] = WANT.map((w) => {
      const r = byCode.get(w.code);
      const nominal = r ? parseFloat(r.Nominal) || 1 : 1;
      const rate = r ? parseFloat(r.Rate) / nominal : FALLBACK[w.code];
      const diff = r ? parseFloat(r.Diff) / nominal : 0;
      return { code: w.code, name: w.name, flag: w.flag, rate: +rate.toFixed(2), diff: +diff.toFixed(2) };
    });
    const updatedAt = raw[0]?.Date ? cbuDate(raw[0].Date) : new Date().toISOString();
    g.__ratesCache = { data, updatedAt, source: "cbu", fetchedAt: Date.now() };
    return { data, updatedAt, source: "cbu" };
  } catch {
    // fallback: last cache (even if stale) or hardcoded snapshot
    if (c) return { data: c.data, updatedAt: c.updatedAt, source: c.source };
    const data: Rate[] = WANT.map((w) => ({ code: w.code, name: w.name, flag: w.flag, rate: FALLBACK[w.code], diff: 0 }));
    const out = { data, updatedAt: new Date().toISOString(), source: "fallback" as const, fetchedAt: Date.now() };
    g.__ratesCache = out;
    return { data, updatedAt: out.updatedAt, source: "fallback" };
  }
}

// CBU date is "DD.MM.YYYY" → ISO
function cbuDate(d: string): string {
  const [dd, mm, yyyy] = d.split(".");
  return yyyy && mm && dd ? new Date(`${yyyy}-${mm}-${dd}T00:00:00`).toISOString() : new Date().toISOString();
}
