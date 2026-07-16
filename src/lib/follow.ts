import { prisma } from "./prisma";

const fid = () => "f-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function toggleFollow(followerId: string, targetType: string, targetId: string) {
  const existing = await prisma.follow.findUnique({ where: { followerId_targetType_targetId: { followerId, targetType, targetId } } });
  if (existing) await prisma.follow.delete({ where: { id: existing.id } });
  else await prisma.follow.create({ data: { id: fid(), followerId, targetType, targetId } });
  const count = await prisma.follow.count({ where: { targetType, targetId } });
  return { following: !existing, count };
}

export async function followStatus(followerId: string | null | undefined, targetType: string, targetId: string) {
  const [f, count] = await Promise.all([
    followerId ? prisma.follow.findUnique({ where: { followerId_targetType_targetId: { followerId, targetType, targetId } } }) : Promise.resolve(null),
    prisma.follow.count({ where: { targetType, targetId } }),
  ]);
  return { following: !!f, count };
}

export async function followerCount(targetType: string, targetId: string) {
  return prisma.follow.count({ where: { targetType, targetId } });
}

export async function myFollows(followerId: string) {
  return prisma.follow.findMany({ where: { followerId }, orderBy: { createdAt: "desc" } });
}
