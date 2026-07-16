import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { followStatus } from "@/lib/follow";

export const GET = withHandler(async (req: Request) => {
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  const id = u.searchParams.get("id");
  if (!type || !id) return NextResponse.json({ following: false, count: 0 });
  const user = await currentUser();
  return NextResponse.json(await followStatus(user?.id, type, id));
});
