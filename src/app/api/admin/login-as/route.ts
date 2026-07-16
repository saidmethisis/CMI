import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { audit } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";

// Super-admin "Login as user" — sets an impersonation cookie (demo).
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("users.login_as"); if (g.error) return g.error;
  const { userId, name, roleSlug } = await readBody(req);
  await audit("Суперадмин", "user.login_as", `${name} (${roleSlug})`);
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set("aktiv_impersonate", JSON.stringify({ userId, name, roleSlug }), { path: "/", maxAge: 3600 });
  return res;
});

export const DELETE = withHandler(async () => {
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.delete("aktiv_impersonate");
  return res;
});
