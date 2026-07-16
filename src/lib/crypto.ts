// Crypto quotes from CoinGecko (free, no key), cached with fallback — same pattern as currency.
export interface Coin { symbol: string; name: string; price: number; changePct: number }

const COINS: { id: string; symbol: string; name: string }[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "tether", symbol: "USDT", name: "Tether" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
];
const FALLBACK: Record<string, number> = { BTC: 63000, ETH: 1780, USDT: 1, USDC: 1, ADA: 0.16, XRP: 1.08, SOL: 76, DOGE: 0.072, DOT: 0.84, SHIB: 0.0000042 };

const URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.map((c) => c.id).join(",")}&vs_currencies=usd&include_24hr_change=true`;
const TTL = 60 * 1000; // 1 min

type Cache = { data: Coin[]; updatedAt: string; source: "coingecko" | "fallback"; fetchedAt: number };
const g = globalThis as unknown as { __cryptoCache?: Cache };

export async function getCrypto(): Promise<{ data: Coin[]; updatedAt: string; source: string }> {
  const c = g.__cryptoCache;
  if (c && Date.now() - c.fetchedAt < TTL) return { data: c.data, updatedAt: c.updatedAt, source: c.source };
  try {
    const res = await fetch(URL, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("cg " + res.status);
    const raw = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;
    const data: Coin[] = COINS.map((coin) => {
      const r = raw[coin.id];
      return { symbol: coin.symbol, name: coin.name, price: r ? r.usd : FALLBACK[coin.symbol], changePct: r ? +r.usd_24h_change.toFixed(2) : 0 };
    });
    const out: Cache = { data, updatedAt: new Date().toISOString(), source: "coingecko", fetchedAt: Date.now() };
    g.__cryptoCache = out;
    return { data, updatedAt: out.updatedAt, source: "coingecko" };
  } catch {
    if (c) return { data: c.data, updatedAt: c.updatedAt, source: c.source };
    const data: Coin[] = COINS.map((coin) => ({ symbol: coin.symbol, name: coin.name, price: FALLBACK[coin.symbol], changePct: 0 }));
    g.__cryptoCache = { data, updatedAt: new Date().toISOString(), source: "fallback", fetchedAt: Date.now() };
    return { data, updatedAt: new Date().toISOString(), source: "fallback" };
  }
}
