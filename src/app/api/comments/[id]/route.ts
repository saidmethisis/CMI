import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { editComment, deleteComment, setPinned, moderateComment, COMMENT_MAX } from "@/lib/comments";
import { getRole } from "@/lib/rbac-store";
import { can } from "@/lib/permissions";

async function isModerator(roleSlug: string) {
  const role = await getRole(roleSlug);
  return can(role?.permissions, "comments.moderate");
}

export const PATCH = withHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const { action, body, pinned, status } = await readBody(req);

  if (action === "pin" || action === "moderate") {
    if (!(await isModerator(user.roleSlug))) return NextResponse.json({ error: { message: "Нет прав модерации." } }, { status: 403 });
    if (action === "pin") await setPinned(id, !!pinned);
    else {
      // Статус из белого списка: раньше сюда проходила любая строка и
      // сохранялась в базу — комментарий получал статус, которого нет в системе,
      // и переставал показываться вообще где-либо.
      const ALLOWED = ["approved", "pending", "spam", "rejected"];
      if (!ALLOWED.includes(status)) {
        return NextResponse.json({ error: { message: "Недопустимый статус комментария." } }, { status: 422 });
      }
      await moderateComment(id, status, user.id);
    }
    return NextResponse.json({ data: { ok: true } });
  }
  // edit own — тот же предел длины, что и при создании, иначе ограничение
  // обходится правкой уже созданного комментария
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: { message: "Пустой комментарий." } }, { status: 422 });
  }
  if (body.length > COMMENT_MAX) {
    return NextResponse.json({ error: { message: `Комментарий длиннее ${COMMENT_MAX} символов.` } }, { status: 422 });
  }
  const res = await editComment(id, user.id, body ?? "");
  if ("error" in res) return NextResponse.json({ error: { message: "Можно редактировать только свой комментарий." } }, { status: 403 });
  return NextResponse.json({ data: { ok: true } });
});

export const DELETE = withHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const res = await deleteComment(id, user.id, await isModerator(user.roleSlug));
  if ("error" in res) return NextResponse.json({ error: { message: "Нельзя удалить этот комментарий." } }, { status: 403 });
  return NextResponse.json({ data: { ok: true } });
});
