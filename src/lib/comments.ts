import { prisma } from "./prisma";
import { notify } from "./notifications";

const STOP = ["viagra", "casino", "porn", "loan", "ставки", "казино", "крипто-бонус"];
function spamScore(body: string) {
  const urls = (body.match(/https?:\/\//g) || []).length;
  const bad = STOP.some((w) => body.toLowerCase().includes(w));
  return { flagged: urls > 2 || bad, reason: bad ? "stopword" : urls > 2 ? "links" : "" };
}

export interface CommentNode {
  id: string; userId: string | null; author: string; authorAvatar: string; body: string;
  status: string; likes: number; dislikes: number; reports: number; pinned: boolean; edited: boolean;
  createdAt: string; myReaction: "like" | "dislike" | null; replies: CommentNode[];
}

export async function getCommentsTree(articleId: string, viewerId?: string): Promise<CommentNode[]> {
  // Публично видны только одобренные; свой ещё-не-прошедший модерацию комментарий видит его автор.
  const rows = await prisma.comment.findMany({
    where: { articleId, OR: [{ status: "approved" }, ...(viewerId ? [{ status: "pending", userId: viewerId }] : [])] },
    orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
  });
  const reactions = viewerId ? await prisma.commentReaction.findMany({ where: { userId: viewerId, commentId: { in: rows.map((r) => r.id) } } }) : [];
  const rmap = new Map(reactions.map((r) => [r.commentId, r.type as "like" | "dislike"]));
  const nodes = new Map<string, CommentNode>();
  rows.forEach((r) => nodes.set(r.id, { id: r.id, userId: r.userId, author: r.author, authorAvatar: r.authorAvatar, body: r.body, status: r.status, likes: r.likes, dislikes: r.dislikes, reports: r.reports, pinned: r.pinned, edited: r.edited, createdAt: r.createdAt.toISOString(), myReaction: rmap.get(r.id) ?? null, replies: [] }));
  const roots: CommentNode[] = [];
  rows.forEach((r) => {
    const node = nodes.get(r.id)!;
    if (r.parentId && nodes.has(r.parentId)) nodes.get(r.parentId)!.replies.push(node);
    else roots.push(node);
  });
  return roots;
}

export async function addComment(input: { articleId: string; userId: string; author: string; avatar: string; body: string; parentId?: string }) {
  const { flagged } = spamScore(input.body);
  const created = await prisma.comment.create({
    data: {
      articleId: input.articleId, userId: input.userId, author: input.author, authorAvatar: input.avatar,
      body: input.body.slice(0, 4000), parentId: input.parentId ?? null, status: flagged ? "pending" : "approved",
    },
  });
  // notify the author of the parent comment about the reply
  if (input.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
    if (parent?.userId && parent.userId !== input.userId) {
      const art = await prisma.article.findUnique({ where: { id: input.articleId } });
      await notify(parent.userId, { type: "reply", title: `${input.author} ответил(а) на ваш комментарий`, body: input.body.slice(0, 120), link: art ? `/article/${art.slug}#comments` : "" });
    }
  }
  return created;
}

export async function reactComment(commentId: string, userId: string, type: "like" | "dislike") {
  const existing = await prisma.commentReaction.findUnique({ where: { commentId_userId: { commentId, userId } } });
  if (existing && existing.type === type) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.commentReaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await prisma.commentReaction.create({ data: { commentId, userId, type } });
  }
  const [likes, dislikes] = await Promise.all([
    prisma.commentReaction.count({ where: { commentId, type: "like" } }),
    prisma.commentReaction.count({ where: { commentId, type: "dislike" } }),
  ]);
  await prisma.comment.update({ where: { id: commentId }, data: { likes, dislikes } });
  return { likes, dislikes };
}

export async function reportComment(commentId: string) {
  const c = await prisma.comment.update({ where: { id: commentId }, data: { reports: { increment: 1 } } });
  if (c.reports >= 3 && c.status === "approved") await prisma.comment.update({ where: { id: commentId }, data: { status: "pending" } });
  return { reports: c.reports };
}

export async function editComment(commentId: string, userId: string, body: string) {
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c || c.userId !== userId) return { error: "FORBIDDEN" as const };
  return { comment: await prisma.comment.update({ where: { id: commentId }, data: { body: body.slice(0, 4000), edited: true } }) };
}

export async function deleteComment(commentId: string, userId: string, isModerator: boolean) {
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c) return { error: "NOT_FOUND" as const };
  if (c.userId !== userId && !isModerator) return { error: "FORBIDDEN" as const };
  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}

export async function setPinned(commentId: string, pinned: boolean) {
  await prisma.comment.update({ where: { id: commentId }, data: { pinned } });
}
export type MyComment = { id: string; body: string; status: string; createdAt: string; articleSlug: string; articleTitle: string };
export async function commentsByUser(userId: string, take = 50): Promise<MyComment[]> {
  const rows = await prisma.comment.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take,
    include: { article: { select: { slug: true, title: true } } },
  });
  return rows.map((c) => ({ id: c.id, body: c.body, status: c.status, createdAt: c.createdAt.toISOString(), articleSlug: c.article.slug, articleTitle: c.article.title }));
}

export async function moderateComment(commentId: string, status: string, moderatorId?: string) {
  await prisma.comment.update({ where: { id: commentId }, data: { status, moderatorId: moderatorId ?? null, moderatedAt: new Date() } });
}

// ── owner-scoped moderation: writer moderates comments on their OWN articles ──
export type AuthorComment = { id: string; author: string; body: string; status: string; createdAt: string; articleTitle: string; articleSlug: string };
export async function commentsByAuthor(userId: string, take = 60): Promise<AuthorComment[]> {
  const arts = await prisma.article.findMany({
    where: { authorUserId: userId },
    select: { slug: true, title: true, comments: { orderBy: { createdAt: "desc" }, select: { id: true, author: true, body: true, status: true, createdAt: true } } },
  });
  const rows = arts.flatMap((a) => a.comments.map((c) => ({
    id: c.id, author: c.author, body: c.body, status: c.status, createdAt: c.createdAt.toISOString(), articleTitle: a.title, articleSlug: a.slug,
  })));
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows.slice(0, take);
}
async function ownsComment(commentId: string, userId: string) {
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { articleId: true } });
  if (!c) return false;
  const art = await prisma.article.findUnique({ where: { id: c.articleId }, select: { authorUserId: true } });
  return art?.authorUserId === userId;
}
export async function moderateOwnComment(commentId: string, userId: string, status: string) {
  if (!(await ownsComment(commentId, userId))) return { error: "FORBIDDEN" as const };
  await prisma.comment.update({ where: { id: commentId }, data: { status, moderatorId: userId, moderatedAt: new Date() } });
  return { ok: true };
}
export async function deleteOwnComment(commentId: string, userId: string) {
  if (!(await ownsComment(commentId, userId))) return { error: "FORBIDDEN" as const };
  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
