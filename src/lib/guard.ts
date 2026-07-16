// Server-side access guards for pages (RSC). Redirect unauthorized users.
import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { getRole } from "./rbac-store";
import { can, canAccessAdmin } from "./permissions";

export async function getAuth() {
  const user = await currentUser();
  if (!user) return { user: null, role: null, perms: [] as string[] };
  const role = await getRole(user.roleSlug);
  return { user, role, perms: (role?.permissions ?? []) as string[] };
}

export async function requireUser(next: string) {
  const a = await getAuth();
  if (!a.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return a;
}

export async function requirePermission(perm: string, next: string) {
  const a = await getAuth();
  if (!a.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!can(a.perms, perm)) redirect(`/?e=forbidden`);
  return a;
}

export async function requireAdmin(next: string) {
  const a = await getAuth();
  if (!a.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!canAccessAdmin(a.perms)) redirect(`/?e=forbidden`);
  return a;
}
