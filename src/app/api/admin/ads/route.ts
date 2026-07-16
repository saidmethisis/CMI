import { NextResponse } from "next/server";
import { readBody, apiError } from "@/lib/api";
import { updateAd, createAd } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

export async function POST(req: Request) {
  const g = await apiGuard("ads.create");
  if (g.error) return g.error;
  const { title, slot, url, frequency } = await readBody(req);
  if (!title?.trim()) return apiError("Укажите название баннера.", 422);
  return NextResponse.json({ data: await createAd({ title, slot, url, frequency }) }, { status: 201 });
}

// Включение/выключение баннера и смена частоты — с записью в БД.
export async function PATCH(req: Request) {
  const g = await apiGuard("ads.edit");
  if (g.error) return g.error;
  try {
    const { id, active, frequency } = await req.json();
    if (!id) return NextResponse.json({ error: { message: "id обязателен." } }, { status: 422 });
    const res = await updateAd(id, { active, frequency });
    return NextResponse.json({ data: res });
  } catch {
    return NextResponse.json({ error: { message: "Не удалось обновить баннер." } }, { status: 400 });
  }
}
