import { NextResponse } from "next/server";
import { readBody, apiError, withHandler } from "@/lib/api";
import { apiGuard } from "@/lib/api-guard";
import { listCompanyRequests, updateCompanyRequest } from "@/lib/store";

// Заявки компании. Компания видит/меняет ТОЛЬКО свои заявки (по user.companyId).
// Суперадмин (perms "*") может указать companyId в query и менять любые.
export const GET = withHandler(async (req: Request) => {
  const g = await apiGuard("ads.view");
  if (g.error) return g.error;
  const isSuper = g.perms.includes("*");
  const companyId = isSuper ? (new URL(req.url).searchParams.get("companyId") || g.user.companyId || "") : (g.user.companyId || "");
  if (!companyId) return apiError("Компания не определена для пользователя.", 400);
  return NextResponse.json({ data: await listCompanyRequests(companyId) });
});

export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("ads.view");
  if (g.error) return g.error;
  const { id, status } = await readBody(req);
  if (!id || !["new", "processing", "done", "rejected"].includes(status)) {
    return apiError("Нужны id и корректный статус.", 422);
  }
  const isSuper = g.perms.includes("*");
  // компания — только свои заявки; суперадмин — без ограничения
  const scope = isSuper ? undefined : (g.user.companyId || "__none__");
  const res = await updateCompanyRequest(id, status, scope);
  if ("error" in res) return apiError("Можно менять только заявки своей компании.", 403);
  return NextResponse.json({ data: res });
});
