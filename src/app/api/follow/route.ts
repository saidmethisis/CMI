import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { toggleFollow, myFollows } from "@/lib/follow";
import { getAuthor } from "@/lib/rbac-store";
import { categories as seedCats } from "@/lib/seed";
import { getCategories } from "@/lib/store";
import { guardRate } from "@/lib/rate-limit";

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
  const rl = await guardRate("follow", user.id); if (rl) return rl;
  const { targetType, targetId } = await readBody(req);
  // Белый список типов. Раньше проверялась только «непустота», поэтому в таблицу
  // подписок можно было писать любой мусор — и запрет самоподписки обходился
  // регистром: «Author» вместо «author».
  if ((targetType !== "author" && targetType !== "topic") || typeof targetId !== "string" || !targetId.trim() || targetId.length > 100) {
    return NextResponse.json({ error: { message: "Некорректный запрос." } }, { status: 422 });
  }
  // Цель должна существовать, иначе копятся подписки в пустоту.
  if (targetType === "author") {
    const a = await getAuthor(targetId);
    if (!a) return NextResponse.json({ error: { message: "Автор не найден." } }, { status: 404 });
    if (user.authorId === a.id) return NextResponse.json({ error: { message: "Нельзя подписаться на самого себя." } }, { status: 400 });
  } else {
    const cats = await getCategories();
    if (!cats.some((c) => c.slug === targetId)) {
      return NextResponse.json({ error: { message: "Рубрика не найдена." } }, { status: 404 });
    }
  }
  return NextResponse.json({ data: await toggleFollow(user.id, targetType, targetId) });
});
