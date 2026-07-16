import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { listAuthors, createAuthor, updateAuthor, deleteAuthor } from "@/lib/rbac-store";
import { apiGuard } from "@/lib/api-guard";

export const GET = withHandler(async () => {
  const g = await apiGuard("authors.view"); if (g.error) return g.error;
  return NextResponse.json({ data: await listAuthors() });
});
export const POST = withHandler(async (req: Request) => {
  const g = await apiGuard("authors.create"); if (g.error) return g.error;
  const { firstName, lastName, profile, companyId } = await readBody(req);
  if (!firstName?.trim()) return NextResponse.json({ error: { message: "Укажите имя автора." } }, { status: 422 });
  const res = await createAuthor({ firstName, lastName, profile, companyId });
  if ("error" in res) return NextResponse.json({ error: { message: "Автор уже существует." } }, { status: 409 });
  return NextResponse.json({ data: res.author }, { status: 201 });
});
export const PATCH = withHandler(async (req: Request) => {
  const g = await apiGuard("authors.edit"); if (g.error) return g.error;
  const { id, ...patch } = await readBody(req);
  if (!id) return NextResponse.json({ error: { message: "id обязателен" } }, { status: 422 });
  return NextResponse.json({ data: await updateAuthor(id, patch) });
});
export const DELETE = withHandler(async (req: Request) => {
  const g = await apiGuard("authors.delete"); if (g.error) return g.error;
  const { id } = await readBody(req);
  await deleteAuthor(id);
  return NextResponse.json({ data: { ok: true } });
});
