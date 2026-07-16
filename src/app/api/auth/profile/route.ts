import { NextResponse } from "next/server";
import { readBody, withHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUser, safeUser, randomToken } from "@/lib/auth";
import { audit } from "@/lib/rbac-store";
import { sendEmail, verifyEmailMessage } from "@/lib/email";

const STR = ["name", "displayName", "avatar", "banner", "bio", "phone", "locale", "timezone"] as const;

export const PATCH = withHandler(async (req: Request) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: { message: "Не авторизован" } }, { status: 401 });
  const body = await readBody(req);
  const data: Record<string, unknown> = {};
  for (const k of STR) if (typeof body[k] === "string") data[k] = body[k];
  if (Array.isArray(body.socials)) data.socials = JSON.stringify(body.socials);
  if (body.notifPrefs && typeof body.notifPrefs === "object") data.notifPrefs = JSON.stringify(body.notifPrefs);
  if (body.privacy && typeof body.privacy === "object") data.privacy = JSON.stringify(body.privacy);

  let verifyToken: string | undefined;
  if (typeof body.email === "string" && body.email !== user.email) {
    if (await prisma.appUser.findUnique({ where: { email: body.email } })) {
      return NextResponse.json({ error: { message: "Email уже занят." } }, { status: 409 });
    }
    verifyToken = randomToken(8);
    data.email = body.email; data.emailVerified = false; data.verifyToken = verifyToken;
    const vm = verifyEmailMessage(body.email, verifyToken);
    await sendEmail({ to: body.email, subject: vm.subject, html: vm.html });
  }

  const updated = await prisma.appUser.update({ where: { id: user.id }, data: data as never });
  await audit(user.email, "profile.update");
  // код подтверждения email отдаём только в dev (в проде — письмом)
  return NextResponse.json(process.env.NODE_ENV !== "production" ? { data: safeUser(updated), verifyToken } : { data: safeUser(updated) });
});
