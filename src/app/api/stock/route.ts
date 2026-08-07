import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getStockQuotes } from "@/lib/stock";

export const revalidate = 900;

export const GET = withHandler(async () => {
  const r = await getStockQuotes();
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
});
