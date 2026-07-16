import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getCrypto } from "@/lib/crypto";

export const revalidate = 60;

export const GET = withHandler(async () => {
  const r = await getCrypto();
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
});
