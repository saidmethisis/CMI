import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { addStory, deleteOwnStory } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";
import { guardRate } from "@/lib/rate-limit";

// Предел размера картинки стори. Она попадает в ПУБЛИЧНЫЙ ответ /api/taxonomy,
// который грузит каждый посетитель: одна стори с data-URL на 300 КБ раздувала
// этот ответ с 900 байт до 300 КБ для всех подряд. Картинку нужно загружать
// через /api/upload и передавать сюда ссылку.
const IMAGE_MAX = 2000;
const TITLE_MAX = 120;

// Stories creation for writers AND companies (both roles have news.create).
// Superadmin passes via "*"; readers are rejected.
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const rl = await guardRate("upload", g.user.id);
  if (rl) return rl;
  const { categorySlug, title, image, articleSlug } = await readBody(req);
  if (!title?.trim() || !image) {
    return NextResponse.json({ error: { message: "Нужны заголовок и изображение стори." } }, { status: 422 });
  }
  if (String(title).length > TITLE_MAX) {
    return NextResponse.json({ error: { message: `Заголовок длиннее ${TITLE_MAX} символов.` } }, { status: 422 });
  }
  if (String(image).startsWith("data:")) {
    return NextResponse.json({ error: { message: "Загрузите картинку через форму — сюда нужна ссылка, а не сам файл." } }, { status: 422 });
  }
  if (String(image).length > IMAGE_MAX) {
    return NextResponse.json({ error: { message: "Слишком длинная ссылка на картинку." } }, { status: 422 });
  }
  const res = await addStory({ categorySlug: categorySlug || "tech", title, image, articleSlug: articleSlug || undefined, ownerUserId: g.user.id, companyId: g.user.companyId ?? "" });
  return NextResponse.json({ data: res.story }, { status: 201 });
});

// Удаление своей стори. Раньше эндпоинта удаления не существовало вовсе:
// опубликованную стори нельзя было убрать с главной никаким способом.
export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("news.create");
  if (g.error) return g.error;
  const { id } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });
  // Модератор (news.publish) может убрать любую, автор — только свою.
  const moderator = await apiGuard("news.publish");
  const res = await deleteOwnStory(id, g.user.id, !moderator.error);
  if ("error" in res) {
    return NextResponse.json(
      { error: { message: res.error === "FORBIDDEN" ? "Можно удалять только свои стори." : "Стори не найдена." } },
      { status: res.error === "FORBIDDEN" ? 403 : 404 },
    );
  }
  return NextResponse.json({ data: { ok: true } });
});
