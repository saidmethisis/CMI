import { prisma } from "./prisma";

const nid = () => "n-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export async function notify(userId: string | null | undefined, n: { type?: string; title: string; body?: string; link?: string }) {
  if (!userId) return;
  try {
    await prisma.notification.create({ data: { id: nid(), userId, type: n.type ?? "info", title: n.title, body: n.body ?? "", link: n.link ?? "" } });
  } catch { /* ignore */ }
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}
export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
export async function markRead(userId: string, id?: string) {
  await prisma.notification.updateMany({ where: id ? { userId, id } : { userId }, data: { read: true } });
}
