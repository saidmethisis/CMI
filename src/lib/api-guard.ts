// Server-side access guard for route handlers (API). Returns an error Response when denied.
import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { getRole } from "./rbac-store";
import { can, canAccessAdmin } from "./permissions";

type Denied = { error: NextResponse; user?: undefined };
type Allowed = { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof currentUser>>>; perms: string[] };

export async function apiGuard(perm?: string): Promise<Denied | Allowed> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: { message: "Требуется вход." } }, { status: 401 }) };
  const role = await getRole(user.roleSlug);
  const perms = (role?.permissions ?? []) as string[];
  const ok = perm ? can(perms, perm) : canAccessAdmin(perms);
  if (!ok) return { error: NextResponse.json({ error: { message: "Недостаточно прав." } }, { status: 403 }) };
  return { user, perms };
}
