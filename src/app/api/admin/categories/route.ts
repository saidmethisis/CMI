import { NextResponse } from "next/server";
import { addCategory, updateCategory, deleteCategory } from "@/lib/store";
import { apiGuard } from "@/lib/api-guard";

// Fix (bug #10): adding categories now persists and shows up in menu + stories.
export async function POST(req: Request) {
  const g = await apiGuard("categories.create");
  if (g.error) return g.error;
  const { name, nameUz, nameEn, color } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: { message: "Укажите название категории." } }, { status: 422 });
  }
  const res = await addCategory({ name, nameUz, nameEn, color });
  if ("error" in res) {
    return NextResponse.json({ error: { message: "Такая категория уже существует." } }, { status: 409 });
  }
  return NextResponse.json({ data: res.category }, { status: 201 });
}

export async function PATCH(req: Request) {
  const g = await apiGuard("categories.edit");
  if (g.error) return g.error;
  try {
    const { slug, name, nameUz, nameEn, color } = await req.json();
    if (!slug) return NextResponse.json({ error: { message: "slug обязателен." } }, { status: 422 });
    const res = await updateCategory(slug, { name, nameUz, nameEn, color });
    return NextResponse.json({ data: res.category });
  } catch {
    return NextResponse.json({ error: { message: "Не удалось обновить категорию." } }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const g = await apiGuard("categories.delete");
  if (g.error) return g.error;
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: { message: "slug обязателен." } }, { status: 422 });
    await deleteCategory(slug);
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: { message: "Не удалось удалить категорию." } }, { status: 400 });
  }
}
