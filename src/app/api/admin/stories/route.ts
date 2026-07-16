import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { addStory } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Fix (bug #10): stories upload now works — accepts an image (URL or data-URI).
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("categories.edit");
  if (g.error) return g.error;
  const { categorySlug, title, image, articleSlug } = await readBody(req);
  if (!title?.trim() || !image) {
    return NextResponse.json({ error: { message: "Нужны заголовок и изображение стори." } }, { status: 422 });
  }
  const res = await addStory({ categorySlug: categorySlug || "tech", title, image, articleSlug });
  return NextResponse.json({ data: res.story }, { status: 201 });
});
