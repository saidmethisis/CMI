import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentToken, destroySession, SESSION_COOKIE } from "@/lib/auth";

export const POST = withHandler(async () => {
  const token = await currentToken();
  if (token) await destroySession(token);
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
