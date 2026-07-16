import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getRates } from "@/lib/currency";

export const revalidate = 3600;

export const GET = withHandler(async () => {
  const r = await getRates();
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
});
