import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getBankRates } from "@/lib/bank-rates";

export const revalidate = 3600;

export const GET = withHandler(async () => {
  const r = await getBankRates();
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
});
