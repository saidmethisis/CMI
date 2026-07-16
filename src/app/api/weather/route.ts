import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getWeather } from "@/lib/weather";

export const revalidate = 900;

export async function GET() {
  try {
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
    const data = await getWeather(ip);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch {
    return NextResponse.json({ error: { message: "Погода временно недоступна" } }, { status: 200 });
  }
}
