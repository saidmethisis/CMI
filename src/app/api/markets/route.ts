import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { instruments } from "@/lib/store";
import { getRates } from "@/lib/currency";

// Currency rows use real CBU rates; indices/crypto get small jitter (stand-in for WS feed).
export const GET = withHandler(async () => {
  const rates = await getRates().catch(() => ({ data: [] as { code: string; rate: number; diff: number }[] }));
  const rateByCode = new Map(rates.data.map((r) => [r.code, r]));

  const data = instruments.map((i) => {
    if (i.kind === "currency") {
      const code = i.symbol.split("/")[0]; // "USD/UZS" -> USD
      const r = rateByCode.get(code);
      if (r) {
        const changePct = r.rate ? +((r.diff / r.rate) * 100).toFixed(2) : 0;
        return { ...i, price: Math.round(r.rate), changePct };
      }
    }
    const jitter = (Math.random() - 0.5) * (i.price * 0.004);
    const price = +(i.price + jitter).toFixed(2);
    const changePct = +(i.changePct + (Math.random() - 0.5) * 0.3).toFixed(2);
    return { ...i, price, changePct };
  });
  return NextResponse.json({ data, updatedAt: new Date().toISOString() });
});
