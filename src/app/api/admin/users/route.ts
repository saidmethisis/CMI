import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { listUsers, createUser, updateUser } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";

export const GET = withHandler(async () => {
  const g = await apiGuard("users.view"); if (g.error) return g.error;
  return NextResponse.json({ data: await listUsers() });
});
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("users.create"); if (g.error) return g.error;
  const { name, email, roleSlug, companyId, password } = await readBody(req);
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: { message: "Укажите имя и email." } }, { status: 422 });
  const res = await createUser({ name, email, roleSlug: roleSlug || "reader", companyId, password });
  if ("error" in res) return NextResponse.json({ error: { message: "Пользователь с таким email уже есть." } }, { status: 409 });
  return NextResponse.json({ data: res.user }, { status: 201 });
});
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("users.edit"); if (g.error) return g.error;
  const { id, ...patch } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });
  return NextResponse.json({ data: await updateUser(id, patch) });
});
