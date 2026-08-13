import { prisma } from "./prisma";
import { notify } from "./notifications";

// Единственный источник правды о длине комментария. Раньше API пропускал 5000
// символов, а здесь текст молча резался на 4000 — хвост длинного комментария
// исчезал, и автор об этом не узнавал. Теперь API отклоняет то, что не влезет.
export const COMMENT_MAX = 4000;

// Предел вложенности ответов. Без него можно было построить цепочку в тысячи
// уровней: отрисовка рекурсивная, и такая ветка вешала браузер каждому читателю.
export const REPLY_MAX_DEPTH = 6;

const STOP = ["viagra", "casino", "porn", "loan", "ставки", "казино", "крипто-бонус"];
function spamScore(body: string) {
  const urls = (body.match(/https?:\/\//g) || []).length;
  const bad = STOP.some((w) => body.toLowerCase().includes(w));
  return { flagged: urls > 2 || bad, reason: bad ? "stopword" : urls > 2 ? "links" : "" };
}

export interface CommentNode {
  // mine вместо userId: раньше внутренний идентификатор КАЖДОГО комментатора
  // отдавался любому анониму — это лишняя привязка личности к аккаунту.
  id: string; mine: boolean; author: string; authorAvatar: string; body: string;
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
  rows.forEach((r) => nodes.set(r.id, { id: r.id, mine: !!viewerId && r.userId === viewerId, author: r.author, authorAvatar: r.authorAvatar, body: r.body, status: r.status, likes: r.likes, dislikes: r.dislikes, reports: r.reports, pinned: r.pinned, edited: r.edited, createdAt: r.createdAt.toISOString(), myReaction: rmap.get(r.id) ?? null, replies: [] }));
  const roots: CommentNode[] = [];
  rows.forEach((r) => {
    const node = nodes.get(r.id)!;
    if (r.parentId && nodes.has(r.parentId)) nodes.get(r.parentId)!.replies.push(node);
    else roots.push(node);
  });
  return roots;
}

// Глубина ветки: поднимаемся по родителям, пока не упрёмся в корень.
async function depthOf(parentId: string): Promise<number> {
  let d = 1, cur: string | null = parentId;
  while (cur && d <= REPLY_MAX_DEPTH + 1) {
    const p: { parentId: string | null } | null = await prisma.comment.findUnique({ where: { id: cur }, select: { parentId: true } });
    if (!p?.parentId) break;
    cur = p.parentId; d++;
  }
  return d;
}

export async function addComment(input: { articleId: string; userId: string; author: string; avatar: string; body: string; parentId?: string }) {
  // Статья должна существовать и быть опубликованной: раньше комментарий к
  // несуществующему id падал с 500 (нарушение внешнего ключа), а к черновику —
  // спокойно создавался, если знать его идентификатор.
  const article = await prisma.article.findUnique({ where: { id: input.articleId }, select: { slug: true, status: true } });
  if (!article) return { error: "ARTICLE_NOT_FOUND" as const };
  if (article.status !== "published") return { error: "ARTICLE_NOT_PUBLISHED" as const };

  if (input.parentId) {
    // Ответ должен вести к комментарию ЭТОЙ статьи: иначе ветка «уезжала»
    // в чужое обсуждение и висела там осиротевшим корнем.
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId }, select: { articleId: true } });
    if (!parent || parent.articleId !== input.articleId) return { error: "BAD_PARENT" as const };
    if ((await depthOf(input.parentId)) > REPLY_MAX_DEPTH) return { error: "TOO_DEEP" as const };
  }

  const { flagged } = spamScore(input.body);
  const created = await prisma.comment.create({
    data: {
      articleId: input.articleId, userId: input.userId, author: input.author, authorAvatar: input.avatar,
      body: input.body.slice(0, COMMENT_MAX), parentId: input.parentId ?? null, status: flagged ? "pending" : "approved",
    },
  });
  // notify the author of the parent comment about the reply
  if (input.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
    if (parent?.userId && parent.userId !== input.userId) {
      // В title — i18n-ключ, имя отвечающего и текст идут отдельными полями:
      // уведомление живёт в базе, а читать его могут на любом из трёх языков.
      await notify(parent.userId, {
        type: "reply",
        title: "notif.reply",
        body: `${input.author}: ${input.body.slice(0, 120)}`,
        link: `/n/${article.slug}#comments`,
      });
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

// Порог скрытия. Считаются жалобы от РАЗНЫХ людей: раньше счётчик просто
// инкрементировался, и один пользователь тремя запросами убирал с сайта любой
// комментарий — включая чужой, который ему просто не понравился.
const REPORT_THRESHOLD = 3;

export async function reportComment(commentId: string, userId: string) {
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true, status: true } });
  if (!c) return { error: "NOT_FOUND" as const };
  // На собственный комментарий жаловаться бессмысленно.
  if (c.userId === userId) return { error: "OWN" as const };
  try {
    await prisma.commentReport.create({ data: { commentId, userId } });
  } catch {
    // уникальный индекс (commentId, userId) — повторная жалоба ничего не меняет
    const reports = await prisma.commentReport.count({ where: { commentId } });
    return { reports, already: true };
  }
  const reports = await prisma.commentReport.count({ where: { commentId } });
  // Держим денормализованный счётчик в актуальном состоянии — его читает UI.
  await prisma.comment.update({ where: { id: commentId }, data: { reports } });
  if (reports >= REPORT_THRESHOLD && c.status === "approved") {
    await prisma.comment.update({ where: { id: commentId }, data: { status: "pending" } });
  }
  return { reports };
}

export async function editComment(commentId: string, userId: string, body: string) {
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c || c.userId !== userId) return { error: "FORBIDDEN" as const };
  return { comment: await prisma.comment.update({ where: { id: commentId }, data: { body: body.slice(0, COMMENT_MAX), edited: true } }) };
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
