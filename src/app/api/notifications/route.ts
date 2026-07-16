import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { listNotifications, unreadCount } from "@/lib/notifications";

export const GET = withHandler(async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ data: [], unread: 0 });
  const [data, unread] = await Promise.all([listNotifications(user.id), unreadCount(user.id)]);
  return NextResponse.json({ data, unread });
});
