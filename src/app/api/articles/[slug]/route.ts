import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getArticle } from "@/lib/store";

export const GET = withHandler(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "published") {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json({ data: a });
});
