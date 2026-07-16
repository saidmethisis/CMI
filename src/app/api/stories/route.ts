import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { addStory } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Stories creation for writers AND companies (both roles have news.create).
// Superadmin passes via "*"; readers are rejected.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { categorySlug, title, image, articleSlug } = await readBody(req);
  if (!title?.trim() || !image) {
    return NextResponse.json({ error: { message: "Нужны заголовок и изображение стори." } }, { status: 422 });
  }
  const res = await addStory({ categorySlug: categorySlug || "tech", title, image, articleSlug: articleSlug || undefined, ownerUserId: g.user.id, companyId: g.user.companyId ?? "" });
  return NextResponse.json({ data: res.story }, { status: 201 });
});
