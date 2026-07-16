import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { markRead, unreadCount } from "@/lib/notifications";

export const POST = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const { id } = await readBody(req).catch(() => ({}));
  await markRead(user.id, id);
  return NextResponse.json({ data: { unread: await unreadCount(user.id) } });
});
