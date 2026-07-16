import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { moderateArticle } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Editorial moderation actions (TZ §4.4 — очередь модерации).
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.publish");
  if (g.error) return g.error;
  const { id, action, pinned } = await readBody(req);
  const res = await moderateArticle(id, action, pinned);
  if ("error" in res) {
    const code = res.error === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: { message: res.error } }, { status: code });
  }
  return NextResponse.json({ data: res });
});
