import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { listRoles, createRole, updateRolePermissions, deleteRole } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";

export const GET = withHandler(async () => {
  const g = await apiGuard("roles.view"); if (g.error) return g.error;
  return NextResponse.json({ data: await listRoles() });
});
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("roles.create"); if (g.error) return g.error;
  const { name, description, permissions } = await readBody(req);
  if (!name?.trim()) return NextResponse.json({ error: { message: "Укажите название роли." } }, { status: 422 });
  const res = await createRole({ name, description, permissions: permissions ?? [] });
  if ("error" in res) return NextResponse.json({ error: { message: "Роль уже существует." } }, { status: 409 });
  return NextResponse.json({ data: res.role }, { status: 201 });
});
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("roles.assign_permissions"); if (g.error) return g.error;
  const { slug, permissions } = await readBody(req);
  await updateRolePermissions(slug, permissions ?? []);
  return NextResponse.json({ data: { ok: true } });
});
export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("roles.delete"); if (g.error) return g.error;
  const { slug } = await readBody(req);
  const res = await deleteRole(slug);
  if ("error" in res) {
    const message = res.error === "SYSTEM" ? "Системную роль нельзя удалить." : res.error === "NOT_FOUND" ? "Роль не найдена." : "Ошибка";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
  return NextResponse.json({ data: { ok: true } });
});
