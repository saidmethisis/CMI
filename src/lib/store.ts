// Data-access layer backed by Prisma + SQLite.
// Reference data (categories/stories/instruments) stays static in seed.ts;
// mutable entities (articles, business, accreditation, ads) live in the DB.
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { slugify } from "./slug";
import { notify } from "./notifications";
import type { Article, Comment, AdBanner, AccreditationRequest, BusinessAccount, Category, Story } from "./types";
import {
  seedArticles,
  categories,
  stories,
  instruments,
  businessAccount,
  accreditationRequests,
  adBanners,
} from "./seed";

export { categories, stories, instruments };

// ── lazy, idempotent seeding on first access ─────────────────────────────────
let seeding: Promise<void> | null = null;
async function ensureSeed() {
  if (seeding) return seeding;
  // при ошибке сбрасываем промис, иначе отклонённый промис закэшируется навсегда
  seeding = (async () => {
    try {
      await doSeed();
    } catch (e) {
      seeding = null;
      throw e;
    }
  })();
  return seeding;
}
async function doSeed() {
  if (process.env.AKTIV_NO_SEED === "1") return; // clean production site: no sample content
  if ((await prisma.article.count()) > 0) return;
  {
    for (const a of seedArticles) {
      await prisma.article.create({
        data: {
          id: a.id,
          slug: a.slug,
          title: a.title,
          lead: a.lead,
          body: a.body,
          aiSummary: a.aiSummary,
          cover: a.cover,
          videoUrl: a.videoUrl ?? "",
          categorySlug: a.categorySlug,
          tags: JSON.stringify(a.tags),
          authorName: a.authorName,
          authorKind: a.authorKind,
          company: a.company ?? null,
          createdAt: new Date(a.createdAt),
          readingMinutes: a.readingMinutes,
          premium: a.premium,
          pinned: a.pinned,
          status: a.status,
          views: a.views,
          comments: { create: a.comments.map((c) => ({ id: c.id, author: c.author, body: c.body, status: c.status, createdAt: new Date(c.createdAt) })) },
        },
      });
    }
    await prisma.businessAccount.create({ data: businessAccount });
    await prisma.accreditationRequest.createMany({ data: accreditationRequests });
    await prisma.adBanner.createMany({ data: adBanners });
    await prisma.category.createMany({
      data: categories.map((c) => ({ slug: c.slug, name: c.name, nameUz: c.nameUz ?? "", nameEn: c.nameEn ?? "", color: c.color, order: c.order ?? 0, visible: true })),
    });
    await prisma.story.createMany({
      data: stories.map((s, i) => ({ id: s.id, categorySlug: s.categorySlug, title: s.title, image: s.image, articleSlug: s.articleSlug ?? null, order: i })),
    });
  }
}

// ── taxonomy (categories + stories) ──────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  await ensureSeed();
  const rows = await prisma.category.findMany({ where: { visible: true }, orderBy: { order: "asc" } });
  return rows as Category[];
}

export async function getStories(): Promise<Story[]> {
  await ensureSeed();
  const rows = await prisma.story.findMany({ orderBy: { order: "asc" } });
  return rows as Story[];
}

export async function addCategory(input: { name: string; nameUz?: string; nameEn?: string; color?: string }) {
  await ensureSeed();
  const slug = slugify(input.name, 40) || "cat-" + Date.now().toString(36);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) return { error: "EXISTS" as const };
  const count = await prisma.category.count();
  const c = await prisma.category.create({
    data: { slug, name: input.name.trim(), nameUz: input.nameUz ?? "", nameEn: input.nameEn ?? "", color: input.color || "#14314f", order: count + 1, visible: true },
  });
  return { category: c as Category };
}

export async function updateCategory(slug: string, patch: { name?: string; nameUz?: string; nameEn?: string; color?: string }) {
  await ensureSeed();
  const data: Record<string, string> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.nameUz !== undefined) data.nameUz = patch.nameUz;
  if (patch.nameEn !== undefined) data.nameEn = patch.nameEn;
  if (patch.color !== undefined) data.color = patch.color;
  const c = await prisma.category.update({ where: { slug }, data });
  return { category: c as Category };
}

export async function deleteCategory(slug: string) {
  await ensureSeed();
  // мягкое удаление: скрываем из меню/фильтров, статьи не осиротеют жёстким delete
  await prisma.category.update({ where: { slug }, data: { visible: false } });
  return { ok: true };
}

export async function updateAccreditation(id: string, status: string) {
  await ensureSeed();
  const r = await prisma.accreditationRequest.update({ where: { id }, data: { status } });
  return r as AccreditationRequest;
}

// ── company requests (заявки в кабинете компании) ────────────────────────────
export type CompanyRequestRow = { id: string; companyId: string; client: string; topic: string; status: string; createdAt: string };
const DEMO_REQUESTS = [
  { client: "ООО «Silk Trade»", topic: "Корпоративный тариф", status: "new" },
  { client: "ЧП Азизов", topic: "Эквайринг", status: "processing" },
  { client: "«Bahor» LLC", topic: "Реклама", status: "done" },
  { client: "IT Park Fintech", topic: "Партнёрство", status: "new" },
];
export async function listCompanyRequests(companyId: string): Promise<CompanyRequestRow[]> {
  await ensureSeed();
  let rows = await prisma.companyRequest.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  if (rows.length === 0) {
    // ленивое демо-наполнение для этой компании (без общего реседа)
    await prisma.companyRequest.createMany({ data: DEMO_REQUESTS.map((r, i) => ({ id: `cr-${companyId}-${i}`, companyId, client: r.client, topic: r.topic, status: r.status })) });
    rows = await prisma.companyRequest.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  }
  return rows.map((r) => ({ id: r.id, companyId: r.companyId, client: r.client, topic: r.topic, status: r.status, createdAt: r.createdAt.toISOString() }));
}
// companyId задан → обновляем только если заявка принадлежит этой компании (защита от IDOR).
// companyId не задан (суперадмин) → без ограничения.
export async function updateCompanyRequest(id: string, status: string, companyId?: string): Promise<CompanyRequestRow | { error: "FORBIDDEN" }> {
  await ensureSeed();
  if (companyId) {
    const own = await prisma.companyRequest.findUnique({ where: { id }, select: { companyId: true } });
    if (!own || own.companyId !== companyId) return { error: "FORBIDDEN" as const };
  }
  const r = await prisma.companyRequest.update({ where: { id }, data: { status } });
  return { id: r.id, companyId: r.companyId, client: r.client, topic: r.topic, status: r.status, createdAt: r.createdAt.toISOString() };
}

export async function createAd(input: { title: string; slot?: string; url?: string; frequency?: number }) {
  await ensureSeed();
  const a = await prisma.adBanner.create({
    data: { id: "ad-" + randomUUID().slice(0, 8), slot: input.slot || "top", title: input.title.trim(), url: input.url || "", active: true, frequency: Math.max(1, Math.min(20, input.frequency ?? 3)), impressions: 0 },
  });
  return a as AdBanner;
}
export async function updateAd(id: string, patch: { active?: boolean; frequency?: number }) {
  await ensureSeed();
  const data: Record<string, boolean | number> = {};
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.frequency !== undefined) data.frequency = Math.max(1, Math.min(20, patch.frequency));
  const a = await prisma.adBanner.update({ where: { id }, data });
  return a as AdBanner;
}

export async function addStory(input: { categorySlug: string; title: string; image: string; articleSlug?: string; ownerUserId?: string; companyId?: string }) {
  await ensureSeed();
  const count = await prisma.story.count();
  const s = await prisma.story.create({
    data: { id: "s" + Date.now().toString(36) + randomUUID().slice(0, 4), categorySlug: input.categorySlug, title: input.title, image: input.image, articleSlug: input.articleSlug || null, order: count, ownerUserId: input.ownerUserId ?? "", companyId: input.companyId ?? "" },
  });
  return { story: s as Story };
}

// ── mappers ──────────────────────────────────────────────────────────────────
type Row = Awaited<ReturnType<typeof prisma.article.findFirst>> & { comments?: unknown[] };
function toArticle(r: NonNullable<Row>): Article {
  return {
    ...r,
    tags: safeTags(r.tags),
    authorSocials: safeSocials((r as any).authorSocials),
    company: r.company ?? undefined,
    createdAt: r.createdAt.toISOString(),
    authorKind: r.authorKind as Article["authorKind"],
    status: r.status as Article["status"],
    comments: ((r.comments as any[]) ?? []).map((c) => ({
      id: c.id, author: c.author, body: c.body, status: c.status, createdAt: c.createdAt.toISOString(),
    })) as Comment[],
  };
}
function safeTags(t: string): string[] {
  try { return JSON.parse(t); } catch { return []; }
}
function safeSocials(t?: string): { label: string; url: string }[] {
  try { return t ? JSON.parse(t) : []; } catch { return []; }
}

// ── queries ──────────────────────────────────────────────────────────────────
export async function listPublished(opts: { category?: string; q?: string } = {}): Promise<Article[]> {
  await ensureSeed();
  const rows = await prisma.article.findMany({
    where: {
      status: "published",
      ...(opts.category ? { categorySlug: opts.category } : {}),
      ...(opts.q ? { OR: [{ title: { contains: opts.q } }, { lead: { contains: opts.q } }, { tags: { contains: opts.q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toArticle);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  await ensureSeed();
  const r = await prisma.article.findUnique({ where: { slug }, include: { comments: { orderBy: { createdAt: "desc" } } } });
  return r ? toArticle(r) : undefined;
}

export async function pinnedArticle(): Promise<Article | undefined> {
  await ensureSeed();
  const r = await prisma.article.findFirst({ where: { pinned: true, status: "published" } });
  if (r) return toArticle(r);
  return (await listPublished())[0];
}

export async function moderationQueue(): Promise<Article[]> {
  await ensureSeed();
  const rows = await prisma.article.findMany({ where: { status: "review" }, orderBy: { createdAt: "desc" } });
  return rows.map(toArticle);
}

export async function articlesByCompany(company: string): Promise<Article[]> {
  await ensureSeed();
  return (await prisma.article.findMany({ where: { company }, orderBy: { createdAt: "desc" } })).map(toArticle);
}

export type CompanyComment = { id: string; author: string; body: string; status: string; createdAt: string; articleTitle: string; articleSlug: string };
export async function commentsByCompany(company: string, take = 40): Promise<CompanyComment[]> {
  await ensureSeed();
  const arts = await prisma.article.findMany({
    where: { company },
    select: { slug: true, title: true, comments: { orderBy: { createdAt: "desc" }, select: { id: true, author: true, body: true, status: true, createdAt: true } } },
  });
  const rows = arts.flatMap((a) => a.comments.map((c) => ({
    id: c.id, author: c.author, body: c.body, status: c.status, createdAt: c.createdAt.toISOString(), articleTitle: a.title, articleSlug: a.slug,
  })));
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows.slice(0, take);
}

export type CompanyAuthor = { id: string; slug: string; name: string; position: string; verified: boolean };
export async function companyAuthors(companyId: string): Promise<CompanyAuthor[]> {
  await ensureSeed();
  const rows = await prisma.author.findMany({ where: { companyId } });
  return rows.map((a) => {
    let position = "";
    try { position = (JSON.parse(a.profile || "{}") as { position?: string }).position || ""; } catch { /* */ }
    return { id: a.id, slug: a.slug, name: `${a.firstName} ${a.lastName}`.trim(), position, verified: a.verifyStatus === "verified" };
  });
}

export async function ugcArticles(): Promise<Article[]> {
  await ensureSeed();
  return (await prisma.article.findMany({ where: { authorKind: "ugc" }, orderBy: { createdAt: "desc" } })).map(toArticle);
}

export async function categoryCounts(): Promise<Record<string, number>> {
  await ensureSeed();
  const grouped = await prisma.article.groupBy({ by: ["categorySlug"], where: { status: "published" }, _count: true });
  return Object.fromEntries(grouped.map((g) => [g.categorySlug, g._count]));
}

export async function getBusiness(): Promise<BusinessAccount> {
  await ensureSeed();
  const existing = await prisma.businessAccount.findFirst();
  if (existing) return existing as BusinessAccount;
  // Фолбэк, если сид отключён (AKTIV_NO_SEED=1) — не падаем на non-null assertion.
  return (await prisma.businessAccount.create({
    data: { id: "biz-default", company: "Asosiy Aktiv", tier: "start", publicationsLimit: 10, publicationsUsed: 0, verified: true },
  })) as BusinessAccount;
}
export async function getAccreditation(): Promise<AccreditationRequest[]> {
  await ensureSeed();
  return (await prisma.accreditationRequest.findMany()) as AccreditationRequest[];
}
export async function getAds(): Promise<AdBanner[]> {
  await ensureSeed();
  return (await prisma.adBanner.findMany()) as AdBanner[];
}

// Полностью реальные метрики для админ-дашборда (без выдуманных чисел).
export async function adminMetrics() {
  await ensureSeed();
  const [published, pending, viewsAgg, comments, authors, companies, users] = await Promise.all([
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "review" } }),
    prisma.article.aggregate({ _sum: { views: true }, where: { status: "published" } }),
    prisma.comment.count(),
    prisma.author.count(),
    prisma.company.count(),
    prisma.appUser.count(),
  ]);
  return { published, pending, views: viewsAgg._sum.views ?? 0, comments, authors, companies, users };
}

export async function kpis() {
  await ensureSeed();
  const [pageViews, pending, published] = await Promise.all([
    prisma.article.aggregate({ _sum: { views: true }, where: { status: "published" } }),
    prisma.article.count({ where: { status: "review" } }),
    prisma.article.count({ where: { status: "published" } }),
  ]);
  return {
    visitorsToday: 18420,
    pageViews: pageViews._sum.views ?? 0,
    newSubscribers: 214,
    mrr: 12750,
    pendingModeration: pending,
    adRevenue: 3820,
    published,
  };
}

// ── mutations ────────────────────────────────────────────────────────────────
export async function submitPrArticle(input: { title: string; lead: string; body: string; company: string; categorySlug: string }) {
  await ensureSeed();
  const biz = await getBusiness();
  if (biz.publicationsUsed >= biz.publicationsLimit) return { error: "LIMIT_REACHED" as const };
  const rid = randomUUID().slice(0, 8);
  const slug = "pr-" + slugify(input.title, 40) + "-" + Date.now().toString(36) + rid.slice(0, 4);
  await prisma.article.create({
    data: {
      id: "a-" + randomUUID(), slug, title: input.title, lead: input.lead, body: input.body,
      aiSummary: `• ${input.company} — материал от партнёра.\n• Прошёл AI-генерацию и отправлен на модерацию.`,
      cover: `https://picsum.photos/seed/${slug}/1200/675`, categorySlug: input.categorySlug || "business",
      tags: JSON.stringify(["PR", input.company]), authorName: `Пресс-служба ${input.company}`, authorKind: "pr",
      company: input.company, readingMinutes: 3, status: "review", views: 0,
    },
  });
  const updated = await prisma.businessAccount.update({ where: { id: biz.id }, data: { publicationsUsed: { increment: 1 } } });
  return { slug, remaining: updated.publicationsLimit - updated.publicationsUsed };
}

export async function submitUgcArticle(input: { title: string; lead: string; body: string; categorySlug: string; tags: string; authorName: string; authorUserId?: string; cover?: string; videoUrl?: string; socials?: { label: string; url: string }[]; asDraft?: boolean }) {
  await ensureSeed();
  const rid = randomUUID().slice(0, 8);
  const slug = "ugc-" + slugify(input.title, 40) + "-" + Date.now().toString(36) + rid.slice(0, 4);
  const a = await prisma.article.create({
    data: {
      id: "a-" + randomUUID(), slug, title: input.title, lead: input.lead, body: input.body,
      aiSummary: `• ${input.title}\n• Авторский материал (UGC).`,
      cover: input.cover || `https://picsum.photos/seed/${slug}/1200/675`, videoUrl: input.videoUrl || "", categorySlug: input.categorySlug || "business",
      tags: JSON.stringify(input.tags.split(",").map((t) => t.trim()).filter(Boolean)),
      authorName: input.authorName || "Независимый автор", authorUserId: input.authorUserId ?? "", authorKind: "ugc",
      authorSocials: JSON.stringify(input.socials ?? []),
      readingMinutes: Math.max(1, Math.round(input.body.split(/\s+/).length / 180)), status: input.asDraft ? "draft" : "review", views: 0,
    },
  });
  return { slug, id: a.id };
}

// ── writer-owned articles (edit/delete own) ──────────────────────────────────
export async function ownArticles(userId: string): Promise<Article[]> {
  await ensureSeed();
  return (await prisma.article.findMany({ where: { authorUserId: userId }, orderBy: { createdAt: "desc" } })).map(toArticle);
}

export async function updateOwnArticle(id: string, userId: string, patch: { title?: string; lead?: string; body?: string; categorySlug?: string; asDraft?: boolean }) {
  await ensureSeed();
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) return { error: "NOT_FOUND" as const };
  if (a.authorUserId !== userId) return { error: "FORBIDDEN" as const };
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.lead !== undefined) data.lead = patch.lead;
  if (patch.body !== undefined) data.body = patch.body;
  if (patch.categorySlug !== undefined) data.categorySlug = patch.categorySlug;
  // writer edits go back to moderation (writer can't self-publish); or stay draft
  data.status = patch.asDraft ? "draft" : "review";
  const u = await prisma.article.update({ where: { id }, data });
  return { ok: true, status: u.status };
}

export async function deleteOwnArticle(id: string, userId: string) {
  await ensureSeed();
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) return { error: "NOT_FOUND" as const };
  if (a.authorUserId !== userId) return { error: "FORBIDDEN" as const };
  await prisma.article.delete({ where: { id } });
  return { ok: true };
}

export async function moderateArticle(id: string, action: string, pinned?: boolean) {
  await ensureSeed();
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) return { error: "NOT_FOUND" as const };
  if (action === "approve") {
    if (pinned) await prisma.article.updateMany({ data: { pinned: false } });
    const u = await prisma.article.update({ where: { id }, data: { status: "published", createdAt: new Date(), pinned: pinned ?? a.pinned } });
    await notify(a.authorUserId, { type: "status", title: `Статья опубликована: «${a.title}»`, link: `/article/${u.slug}` });
    return { id: u.id, status: u.status, pinned: u.pinned };
  }
  if (action === "pin") {
    await prisma.article.updateMany({ data: { pinned: false } });
    const u = await prisma.article.update({ where: { id }, data: { pinned: true } });
    return { id: u.id, status: u.status, pinned: u.pinned };
  }
  const status = action === "reject" ? "rejected" : action === "return" ? "returned" : null;
  if (!status) return { error: "BAD_ACTION" as const };
  const u = await prisma.article.update({ where: { id }, data: { status } });
  await notify(a.authorUserId, {
    type: "status",
    title: status === "rejected" ? `Статья отклонена: «${a.title}»` : `Статья возвращена на доработку: «${a.title}»`,
    link: `/author-panel`,
  });
  return { id: u.id, status: u.status, pinned: u.pinned };
}
