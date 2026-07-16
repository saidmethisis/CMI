import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { toggleFollow, myFollows } from "@/lib/follow";
import { getAuthor } from "@/lib/rbac-store";
import { categories as seedCats } from "@/lib/seed";
import { getCategories } from "@/lib/store";

// GET → my follows (resolved names). POST → toggle follow.
export const GET = withHandler(async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ data: [] });
  const rows = await myFollows(user.id);
  const cats = await getCategories().catch(() => seedCats);
  const resolved = await Promise.all(rows.map(async (r) => {
    if (r.targetType === "author") { const a = await getAuthor(r.targetId); return { ...r, name: a ? `${a.firstName} ${a.lastName}` : r.targetId, href: a ? `/author/${a.slug}` : "#" }; }
    const c = cats.find((x) => x.slug === r.targetId); return { ...r, name: c?.name ?? r.targetId, href: `/category/${r.targetId}` };
  }));
  return NextResponse.json({ data: resolved });
});

export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Войдите, чтобы подписаться." } }, { status: 401 });
  const { targetType, targetId } = await readBody(req);
  if (!targetType || !targetId) return NextResponse.json({ error: { message: "Некорректный запрос." } }, { status: 422 });
  // can't subscribe to yourself
  if (targetType === "author") {
    const a = await getAuthor(targetId);
    if (a && user.authorId === a.id) return NextResponse.json({ error: { message: "Нельзя подписаться на самого себя." } }, { status: 400 });
  }
  return NextResponse.json({ data: await toggleFollow(user.id, targetType, targetId) });
});
