// Data-access layer backed by Prisma + SQLite.
// Reference data (categories/stories) stays static in seed.ts;
// mutable entities (articles, business, accreditation, ads) live in the DB.
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { slugify } from "./slug";
import { notify } from "./notifications";
import type { Article, ArticleTranslations, LangCode, Comment, AdBanner, AccreditationRequest, BusinessAccount, Category, Story } from "./types";
import { categories, stories } from "./seed";

export { categories, stories };

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
  // Runtime bootstrap ensures ONLY the reference taxonomy (categories) so menus and
  // filters work on a fresh database. Sample content (articles, stories, business
  // accounts, ads) is never auto-created — it comes exclusively from the opt-in
  // `npm run seed:demo` script, keeping a production site clean.
  if ((await prisma.category.count()) > 0) return;
  await prisma.category.createMany({
    data: categories.map((c) => ({ slug: c.slug, name: c.name, nameUz: c.nameUz ?? "", nameEn: c.nameEn ?? "", color: c.color, order: c.order ?? 0, visible: true })),
  });
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
// Отдаём только реальные заявки. Раньше здесь на пустом списке досоздавались
// четыре выдуманные («ООО «Silk Trade»», «ЧП Азизов» и т.д.) — компания видела
// в своём кабинете несуществующих клиентов и могла принять их за настоящих.
export async function listCompanyRequests(companyId: string): Promise<CompanyRequestRow[]> {
  await ensureSeed();
  const rows = await prisma.companyRequest.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
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

// Удаление стори: автор убирает свою, модератор — любую.
export async function deleteOwnStory(id: string, userId: string, isModerator = false) {
  await ensureSeed();
  const s = await prisma.story.findUnique({ where: { id }, select: { ownerUserId: true } });
  if (!s) return { error: "NOT_FOUND" as const };
  if (!isModerator && s.ownerUserId !== userId) return { error: "FORBIDDEN" as const };
  await prisma.story.delete({ where: { id } });
  return { ok: true };
}

// ── mappers ──────────────────────────────────────────────────────────────────
type Row = Awaited<ReturnType<typeof prisma.article.findFirst>> & { comments?: unknown[] };
function toArticle(r: NonNullable<Row>): Article {
  return {
    ...r,
    tags: safeTags(r.tags),
    authorSocials: safeSocials((r as any).authorSocials),
    translations: safeTranslations((r as any).translations),
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
function safeTranslations(t?: string): ArticleTranslations {
  try { return t ? (JSON.parse(t) as ArticleTranslations) : {}; } catch { return {}; }
}

// Возвращает title/lead/body статьи на нужном языке: если перевод заполнен — он,
// иначе базовые (язык-фолбэк). Используется на странице статьи и в карточках.
export function localizedArticle(a: Article, lang: LangCode): { title: string; lead: string; body: string } {
  const tr = a.translations?.[lang];
  if (tr && tr.title?.trim()) {
    return { title: tr.title, lead: tr.lead?.trim() ? tr.lead : a.lead, body: tr.body?.trim() ? tr.body : a.body };
  }
  return { title: a.title, lead: a.lead, body: a.body };
}

// Применяет localizedArticle ко всему списку — для лент, рубрик, поиска и карточек.
export function localizeList(items: Article[], lang: LangCode): Article[] {
  return items.map((a) => ({ ...a, ...localizedArticle(a, lang) }));
}

// Нормализует объект переводов от клиента. В translations сохраняются ВСЕ заполненные
// языки (включая основной) — так всегда однозначно известно, на каких языках есть текст.
// Базовые title/lead/body дублируют основной язык и служат фолбэком для остальных.
function normalizeTranslations(input: unknown): { base: { title: string; lead: string; body: string } | null; translations: ArticleTranslations } {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, { title?: string; lead?: string; body?: string }>;
  const order: LangCode[] = ["ru", "uz", "en"];
  const translations: ArticleTranslations = {};
  for (const l of order) {
    const v = src[l];
    if (v && (v.title?.trim() || v.lead?.trim() || v.body?.trim())) {
      translations[l] = { title: (v.title ?? "").trim(), lead: (v.lead ?? "").trim(), body: (v.body ?? "").trim() };
    }
  }
  // основной язык = первый, где заполнены все три поля; иначе первый непустой
  const primary = order.find((l) => translations[l]?.title && translations[l]?.lead && translations[l]?.body)
    ?? order.find((l) => translations[l]);
  if (!primary) return { base: null, translations: {} };
  const base = { title: translations[primary]!.title, lead: translations[primary]!.lead, body: translations[primary]!.body };
  return { base, translations };
}

// ── queries ──────────────────────────────────────────────────────────────────

// Поля для СПИСКОВ (лента, карточки, «похожие», поиск). Сознательно без `body`,
// `aiSummary` и `authorSocials`: тело статьи в карточке не показывается, но именно
// оно составляет почти весь объём строки. Раньше списки тянули статьи целиком —
// главная и страница статьи вычитывали весь архив с полными текстами всех трёх
// языков и отправляли его в браузер. На 500 материалах это ~9 МБ на каждый заход.
const CARD_FIELDS = {
  id: true, slug: true, title: true, lead: true, translations: true, cover: true, videoUrl: true,
  categorySlug: true, tags: true, authorName: true, authorUserId: true, authorKind: true,
  company: true, createdAt: true, readingMinutes: true, premium: true, pinned: true,
  status: true, views: true,
} as const;

// Верхняя граница выборки: без неё запрос растёт линейно вместе с архивом.
// Для главной и «похожих» этого с запасом достаточно.
const LIST_LIMIT = 300;

// Достраивает до формы Article поля, которых нет в облегчённой выборке.
//
// Отдельно вычищаем тексты из `translations`: там лежит ПОЛНАЯ копия статьи на
// каждом языке, поэтому без этого исключение колонки `body` ничего не давало —
// тело всё равно уезжало в браузер, да ещё и трижды. Заголовок и лид оставляем:
// по ним карточка локализуется.
function toCard(r: Record<string, unknown>): Article {
  let translations = "{}";
  try {
    const tr = JSON.parse((r.translations as string) || "{}") as Record<string, { title?: string; lead?: string }>;
    const light: Record<string, { title: string; lead: string; body: string }> = {};
    for (const [lang, v] of Object.entries(tr)) {
      light[lang] = { title: v?.title ?? "", lead: v?.lead ?? "", body: "" };
    }
    translations = JSON.stringify(light);
  } catch { /* повреждённый JSON — отдаём пустые переводы */ }
  return toArticle({ ...r, translations, body: "", aiSummary: "", authorSocials: "[]" } as never);
}

export async function listPublished(opts: { category?: string; q?: string; take?: number } = {}): Promise<Article[]> {
  await ensureSeed();
  const rows = await prisma.article.findMany({
    where: {
      status: "published",
      ...(opts.category ? { categorySlug: opts.category } : {}),
      // mode: "insensitive" обязателен: в PostgreSQL `contains` без него — это
      // регистрозависимый LIKE, и фильтр по подрубрике молча не находил ничего.
      ...(opts.q ? { OR: [
        { title: { contains: opts.q, mode: "insensitive" as const } },
        { lead: { contains: opts.q, mode: "insensitive" as const } },
        { tags: { contains: opts.q, mode: "insensitive" as const } },
      ] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? LIST_LIMIT,
    select: CARD_FIELDS,
  });
  return rows.map(toCard);
}

// Самые читаемые — считаются базой, а не сортировкой всего архива в памяти.
export async function listPopular(take = 10): Promise<Article[]> {
  await ensureSeed();
  const rows = await prisma.article.findMany({
    where: { status: "published" }, orderBy: { views: "desc" }, take, select: CARD_FIELDS,
  });
  return rows.map(toCard);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  await ensureSeed();
  // Комментарии грузит отдельный запрос из клиента (Comments.tsx) — здесь они
  // не нужны, а include без лимита разрастался вместе с обсуждением.
  const r = await prisma.article.findUnique({ where: { slug } });
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

// Функция kpis() удалена: она возвращала выдуманные константы
// (visitorsToday: 18420, mrr: 12750, adRevenue: 3820) вперемешку с реальными
// счётчиками и нигде не вызывалась. Реальные метрики дашборда — в adminMetrics().

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
      cover: "", categorySlug: input.categorySlug || "business",
      tags: JSON.stringify(["PR", input.company]), authorName: `Пресс-служба ${input.company}`, authorKind: "pr",
      company: input.company, readingMinutes: 3, status: "review", views: 0,
    },
  });
  const updated = await prisma.businessAccount.update({ where: { id: biz.id }, data: { publicationsUsed: { increment: 1 } } });
  return { slug, remaining: updated.publicationsLimit - updated.publicationsUsed };
}

export async function submitUgcArticle(input: { title: string; lead: string; body: string; categorySlug: string; tags: string; authorName: string; authorUserId?: string; cover?: string; videoUrl?: string; socials?: { label: string; url: string }[]; asDraft?: boolean; translations?: unknown }) {
  await ensureSeed();
  // если пришли многоязычные поля — основной язык идёт в базовые поля, остальные в translations
  const norm = input.translations ? normalizeTranslations(input.translations) : null;
  const title = norm?.base?.title || input.title;
  const lead = norm?.base?.lead || input.lead;
  const body = norm?.base?.body || input.body;
  const translations = norm?.translations ?? {};
  const rid = randomUUID().slice(0, 8);
  const slug = "ugc-" + slugify(title, 40) + "-" + Date.now().toString(36) + rid.slice(0, 4);
  const a = await prisma.article.create({
    data: {
      id: "a-" + randomUUID(), slug, title, lead, body,
      translations: JSON.stringify(translations),
      aiSummary: buildAiSummary(title, lead),
      cover: input.cover || "", videoUrl: input.videoUrl || "", categorySlug: input.categorySlug || "business",
      tags: JSON.stringify(input.tags.split(",").map((t) => t.trim()).filter(Boolean)),
      authorName: input.authorName || "Независимый автор", authorUserId: input.authorUserId ?? "", authorKind: "ugc",
      authorSocials: JSON.stringify(input.socials ?? []),
      readingMinutes: readingTime(body), status: input.asDraft ? "draft" : "review", views: 0,
    },
  });
  return { slug, id: a.id };
}

// Сводка над статьёй. Строится из самого материала и не содержит служебных фраз
// на одном языке: раньше вторая строка была русским литералом «Авторский материал
// (UGC)» и висела над английским текстом у англоязычного читателя.
function buildAiSummary(title: string, lead: string): string {
  const l = (lead || "").trim();
  return l ? `• ${title}\n• ${l}` : `• ${title}`;
}

// Слов в минуту при подсчёте времени чтения.
const WPM = 180;
const readingTime = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / WPM));

// Инкремент просмотров опубликованной статьи (dashboard «Ko'rishlar» и топ материалов).
//
// Один и тот же читатель не должен накручивать счётчик обновлением страницы, поэтому
// пара «читатель + статья» засчитывается не чаще раза в 30 минут. Дедуп в памяти
// процесса: он не переживает перезапуск и не общий на несколько инстансов, но своей
// задачи — отсечь F5 и частые перезаходы — достигает без лишней инфраструктуры.
// Полный учёт уникальных посетителей — задача аналитики (GA/Я.Метрика), а не этого счётчика.
const VIEW_DEDUP_MS = 30 * 60 * 1000;
const vg = globalThis as unknown as { __viewSeen?: Map<string, number> };
const viewSeen = vg.__viewSeen ?? (vg.__viewSeen = new Map<string, number>());

export async function bumpViews(slug: string, viewerKey?: string) {
  if (viewerKey) {
    const k = `${viewerKey}|${slug}`;
    const now = Date.now();
    const last = viewSeen.get(k);
    if (last && now - last < VIEW_DEDUP_MS) return;
    viewSeen.set(k, now);
    // чистим протухшие записи, чтобы карта не росла бесконечно
    if (viewSeen.size > 5000) {
      for (const [key, ts] of viewSeen) if (now - ts > VIEW_DEDUP_MS) viewSeen.delete(key);
    }
  }
  try { await prisma.article.update({ where: { slug }, data: { views: { increment: 1 } } }); } catch { /* статья могла быть удалена — молча игнорируем */ }
}

// ── writer-owned articles (edit/delete own) ──────────────────────────────────
export async function ownArticles(userId: string): Promise<Article[]> {
  await ensureSeed();
  return (await prisma.article.findMany({ where: { authorUserId: userId }, orderBy: { createdAt: "desc" } })).map(toArticle);
}

export async function updateOwnArticle(id: string, userId: string, patch: { title?: string; lead?: string; body?: string; categorySlug?: string; asDraft?: boolean; translations?: unknown }) {
  await ensureSeed();
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) return { error: "NOT_FOUND" as const };
  if (a.authorUserId !== userId) return { error: "FORBIDDEN" as const };
  const data: Record<string, unknown> = {};
  if (patch.translations !== undefined) {
    // многоязычная правка: основной язык → базовые поля, остальные → translations
    const norm = normalizeTranslations(patch.translations);
    // Пустая правка — это ошибка, а не «сохранить ничего». Раньше здесь молча
    // ничего не записывалось, но статус всё равно менялся: опубликованная статья
    // уходила на повторную модерацию и пропадала с сайта, а ответ был «ок».
    if (!norm.base) return { error: "EMPTY" as const };
    data.title = norm.base.title; data.lead = norm.base.lead; data.body = norm.base.body;
    data.translations = JSON.stringify(norm.translations);
  } else {
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.lead !== undefined) data.lead = patch.lead;
    if (patch.body !== undefined) data.body = patch.body;
  }
  if (patch.categorySlug !== undefined) data.categorySlug = patch.categorySlug;
  // Пересчитываем производные поля от нового текста, иначе после правки время
  // чтения и сводка остаются от прежней версии (в сводке — старый заголовок).
  const newTitle = (data.title as string) ?? a.title;
  const newLead = (data.lead as string) ?? a.lead;
  const newBody = (data.body as string) ?? a.body;
  data.readingMinutes = readingTime(newBody);
  data.aiSummary = buildAiSummary(newTitle, newLead);
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
    // В title кладём i18n-КЛЮЧ, а не готовую фразу: уведомление живёт в базе, а читать
    // его могут на любом языке. Заголовок статьи идёт отдельно в body.
    await notify(a.authorUserId, { type: "status", title: "notif.published", body: a.title, link: `/article/${u.slug}` });
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
    title: status === "rejected" ? "notif.rejected" : "notif.returned",
    body: a.title,
    link: `/author-panel`,
  });
  return { id: u.id, status: u.status, pinned: u.pinned };
}
