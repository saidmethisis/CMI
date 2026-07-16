import { NextResponse } from "next/server";
import { withHandler, apiError } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { commentsByUser } from "@/lib/comments";

// Мои комментарии (для личного кабинета читателя).
export const GET = withHandler(async () => {
  const user = await currentUser();
  if (!user) return apiError("Не авторизован", 401);
  return NextResponse.json({ data: await commentsByUser(user.id) });
});
