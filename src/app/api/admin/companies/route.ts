import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { listCompanies, createCompany, updateCompany, deleteCompany } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";

export const GET = withHandler(async () => {
  const g = await apiGuard("companies.view"); if (g.error) return g.error;
  return NextResponse.json({ data: await listCompanies() });
});
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("companies.create"); if (g.error) return g.error;
  const { name, profile } = await readBody(req);
  if (!name?.trim()) return NextResponse.json({ error: { message: "Укажите название компании." } }, { status: 422 });
  const res = await createCompany({ name, profile });
  if ("error" in res) return NextResponse.json({ error: { message: "Компания уже существует." } }, { status: 409 });
  return NextResponse.json({ data: res.company }, { status: 201 });
});
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("companies.edit"); if (g.error) return g.error;
  const { id, ...patch } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });
  return NextResponse.json({ data: await updateCompany(id, patch) });
});
export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("companies.delete"); if (g.error) return g.error;
  const { id } = await readBody(req);
  await deleteCompany(id);
  return NextResponse.json({ data: { ok: true } });
});
