import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { listUsers, createUser, updateUser } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";
import { safeUser } from "@/lib/auth";

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
  // safeUser: иначе в ответе уезжают passwordHash и токены только что созданного аккаунта
  return NextResponse.json({ data: safeUser(res.user as unknown as Record<string, unknown>) }, { status: 201 });
});

export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("users.edit"); if (g.error) return g.error;
  const { id, ...patch } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });

  // Смена роли — отдельное право, а не часть «редактирования». Иначе обладатель
  // users.edit повышал сам себя до суперадмина: право менять имя и статус
  // не должно давать право раздавать роли.
  if (patch.roleSlug !== undefined) {
    const gr = await apiGuard("users.assign_role");
    if (gr.error) return NextResponse.json({ error: { message: "Недостаточно прав для смены роли." } }, { status: 403 });
    // Суперадмин не должен уметь понизить сам себя и остаться без единого админа.
    if (id === g.user.id && patch.roleSlug !== g.user.roleSlug) {
      return NextResponse.json({ error: { message: "Нельзя менять собственную роль." } }, { status: 422 });
    }
  }
  // Блокировать самого себя тоже нельзя — иначе администратор запирает себя снаружи.
  if (patch.status !== undefined && id === g.user.id && patch.status !== "active") {
    return NextResponse.json({ error: { message: "Нельзя заблокировать собственный аккаунт." } }, { status: 422 });
  }

  const res = await updateUser(id, patch);
  if ("error" in res) return NextResponse.json({ error: { message: "Нет полей для изменения." } }, { status: 422 });
  return NextResponse.json({ data: res });
});
