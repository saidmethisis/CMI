import { NextResponse } from "next/server";
import { updateAccreditation } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Подтверждение/блокировка заявки на аккредитацию — с записью в БД.
export async function PATCH(req: Request) {
  const g = await apiGuard("users.block");
  if (g.error) return g.error;
  try {
    const { id, status } = await req.json();
    if (!id || !["pending", "approved", "blocked"].includes(status)) {
      return NextResponse.json({ error: { message: "Нужны id и корректный статус." } }, { status: 422 });
    }
    const res = await updateAccreditation(id, status);
    return NextResponse.json({ data: res });
  } catch {
    return NextResponse.json({ error: { message: "Не удалось обновить заявку." } }, { status: 400 });
  }
}
