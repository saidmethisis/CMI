import { prisma } from "./prisma";
import { DEFAULT_ROLES, COMPANY_CAPABILITIES, COMPANY_SECTIONS, AUTHOR_CAPABILITIES } from "./permissions";
import { hashPassword } from "./auth";

import { slugify as translit } from "./slug";
const slugify = (s: string) => translit(s, 48) || "id-" + Date.now().toString(36);

const j = (s: string, fallback: unknown) => { try { return JSON.parse(s); } catch { return fallback; } };

let seeding: Promise<void> | null = null;
export async function ensureRbacSeed() {
  if (seeding) return seeding;
  seeding = (async () => {
    if ((await prisma.role.count()) === 0) {
      await prisma.role.createMany({
        data: DEFAULT_ROLES.map((r, i) => ({ id: "role-" + r.slug, slug: r.slug, name: r.name, description: r.description, system: r.system, order: i, permissions: JSON.stringify(r.permissions) })),
      });
    }
    // clean production site: keep roles + a single super-admin login, skip all demo content
    if (process.env.AKTIV_NO_SEED === "1") {
      if ((await prisma.appUser.count()) === 0) {
        await prisma.appUser.create({ data: { id: "u-super", name: "Суперадмин", displayName: "Суперадмин", email: process.env.SUPERADMIN_EMAIL || "super@aktiv.uz", passwordHash: hashPassword(process.env.SUPERADMIN_PASSWORD || "aktiv12345"), roleSlug: "superadmin", status: "active", emailVerified: true } });
      }
      return;
    }
    if ((await prisma.company.count()) === 0) {
      const allSections = COMPANY_SECTIONS.map((s) => s.key);
      const caps = (on: string[]) => Object.fromEntries(COMPANY_CAPABILITIES.map((c) => [c.key, on.includes(c.key)]));
      await prisma.company.createMany({
        data: [
          { id: "co-neobank", slug: "neo-bank", name: "Neo Bank", active: true, verified: true, premium: true, featured: true, ownerUserId: "u-owner", sections: JSON.stringify(allSections), capabilities: JSON.stringify(caps(["publish_news","publish_press","create_authors","edit_own_only","use_analytics","use_seo"])), profile: JSON.stringify({ shortName: "NeoBank", legalName: "OOO Neo Bank", country: "Узбекистан", city: "Ташкент", email: "press@neobank.uz", website: "https://neobank.uz", description: "Цифровой банк для бизнеса." }) },
          { id: "co-greentech", slug: "greentech", name: "GreenTech", active: true, verified: false, premium: false, featured: false, sections: JSON.stringify(["dashboard","news","ads","analytics","seo"]), capabilities: JSON.stringify(caps(["place_ads","publish_jobs","publish_events","create_staff","use_analytics","use_seo"])), profile: JSON.stringify({ country: "Узбекистан", city: "Самарканд", description: "Зелёные технологии и ESG." }) },
        ],
      });
    }
    if ((await prisma.author.count()) === 0) {
      const caps = (on: string[]) => Object.fromEntries(AUTHOR_CAPABILITIES.map((c) => [c.key, on.includes(c.key)]));
      await prisma.author.createMany({
        data: [
          { id: "au-karimov", slug: "aziz-karimov", firstName: "Азиз", lastName: "Каримов", verifyStatus: "verified", companyId: "co-neobank", capabilities: JSON.stringify(caps(["write","edit_own","upload_photos","use_ai"])), profile: JSON.stringify({ position: "Финансовый обозреватель", country: "Узбекистан", city: "Ташкент", languages: ["uz","ru","en"], specialization: "Финансы, финтех", bio: "Пишет о финтехе и рынках Центральной Азии." }) },
          { id: "au-yusupova", slug: "malika-yusupova", firstName: "Малика", lastName: "Юсупова", verifyStatus: "verified", capabilities: JSON.stringify(caps(["write","edit_own","publish_self","edit_seo","reply_comments"])), profile: JSON.stringify({ position: "Технологический журналист", country: "Узбекистан", city: "Ташкент", languages: ["uz","ru"], specialization: "Технологии, стартапы", bio: "Освещает стартапы и AI." }) },
        ],
      });
    }
    if ((await prisma.appUser.count()) === 0) {
      const pw = hashPassword("aktiv12345"); // demo password for all seeded accounts
      await prisma.appUser.createMany({
        data: [
          { id: "u-super", name: "Суперадмин", email: "super@aktiv.uz", passwordHash: pw, roleSlug: "superadmin", status: "active", emailVerified: true },
          { id: "u-owner", name: "Владелец Neo Bank", email: "owner@neobank.uz", passwordHash: pw, roleSlug: "company", companyId: "co-neobank", status: "active", emailVerified: true },
          { id: "u-author", name: "Азиз Каримов", email: "aziz@aktiv.uz", passwordHash: pw, roleSlug: "writer", authorId: "au-karimov", status: "active", emailVerified: true },
          { id: "u-reader", name: "Читатель", email: "reader@aktiv.uz", passwordHash: pw, roleSlug: "reader", status: "active", emailVerified: true },
          { id: "u-blocked", name: "Заблокированный", email: "blocked@aktiv.uz", passwordHash: pw, roleSlug: "reader", status: "blocked", emailVerified: true },
        ],
      });
    }
  })();
  return seeding;
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export async function listRoles() {
  await ensureRbacSeed();
  const rows = await prisma.role.findMany({ orderBy: { order: "asc" } });
  return rows.map((r) => ({ ...r, permissions: j(r.permissions, []) as string[] }));
}
export async function getRole(slug: string) {
  await ensureRbacSeed();
  const r = await prisma.role.findUnique({ where: { slug } });
  return r ? { ...r, permissions: j(r.permissions, []) as string[] } : null;
}
export async function createRole(input: { name: string; description?: string; permissions: string[] }) {
  await ensureRbacSeed();
  const slug = slugify(input.name);
  if (await prisma.role.findUnique({ where: { slug } })) return { error: "EXISTS" as const };
  const count = await prisma.role.count();
  const r = await prisma.role.create({ data: { id: "role-" + slug, slug, name: input.name, description: input.description ?? "", system: false, order: count, permissions: JSON.stringify(input.permissions) } });
  await audit("Суперадмин", "role.create", slug);
  return { role: r };
}
export async function updateRolePermissions(slug: string, permissions: string[]) {
  await ensureRbacSeed();
  await prisma.role.update({ where: { slug }, data: { permissions: JSON.stringify(permissions) } });
  await audit("Суперадмин", "role.update", slug);
}
export async function deleteRole(slug: string) {
  await ensureRbacSeed();
  const r = await prisma.role.findUnique({ where: { slug } });
  if (!r) return { error: "NOT_FOUND" as const };
  if (r.system) return { error: "SYSTEM" as const };
  await prisma.role.delete({ where: { slug } });
  await audit("Суперадмин", "role.delete", slug);
  return { ok: true };
}

// ── Companies ─────────────────────────────────────────────────────────────────
export async function listCompanies() {
  await ensureRbacSeed();
  return (await prisma.company.findMany({ orderBy: { createdAt: "desc" } })).map(mapCompany);
}
export async function getCompany(idOrSlug: string) {
  await ensureRbacSeed();
  const c = await prisma.company.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  return c ? mapCompany(c) : null;
}
function mapCompany(c: NonNullable<Awaited<ReturnType<typeof prisma.company.findFirst>>>) {
  return { ...c, capabilities: j(c.capabilities, {}) as Record<string, boolean>, sections: j(c.sections, []) as string[], profile: j(c.profile, {}) as Record<string, unknown> };
}
export async function createCompany(input: { name: string; profile?: Record<string, unknown> }) {
  await ensureRbacSeed();
  const slug = slugify(input.name);
  if (await prisma.company.findUnique({ where: { slug } })) return { error: "EXISTS" as const };
  const c = await prisma.company.create({ data: { id: "co-" + slug + "-" + Date.now().toString(36), slug, name: input.name, sections: JSON.stringify(["dashboard","news"]), capabilities: "{}", profile: JSON.stringify(input.profile ?? {}) } });
  await audit("Суперадмин", "company.create", slug);
  return { company: mapCompany(c) };
}
export async function updateCompany(id: string, patch: Partial<{ name: string; active: boolean; verified: boolean; premium: boolean; featured: boolean; ownerUserId: string | null; capabilities: Record<string, boolean>; sections: string[]; profile: Record<string, unknown> }>) {
  await ensureRbacSeed();
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.verified !== undefined) data.verified = patch.verified;
  if (patch.premium !== undefined) data.premium = patch.premium;
  if (patch.featured !== undefined) data.featured = patch.featured;
  if (patch.ownerUserId !== undefined) data.ownerUserId = patch.ownerUserId;
  if (patch.capabilities !== undefined) data.capabilities = JSON.stringify(patch.capabilities);
  if (patch.sections !== undefined) data.sections = JSON.stringify(patch.sections);
  if (patch.profile !== undefined) data.profile = JSON.stringify(patch.profile);
  const c = await prisma.company.update({ where: { id }, data: data as never });
  await audit("Суперадмин", "company.update", c.slug);
  return mapCompany(c);
}
export async function deleteCompany(id: string) {
  await ensureRbacSeed();
  await prisma.company.delete({ where: { id } });
  await audit("Суперадмин", "company.delete", id);
}

// ── Authors ───────────────────────────────────────────────────────────────────
export async function listAuthors() {
  await ensureRbacSeed();
  return (await prisma.author.findMany({ orderBy: { createdAt: "desc" } })).map(mapAuthor);
}
export async function getAuthor(idOrSlug: string) {
  await ensureRbacSeed();
  const a = await prisma.author.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  return a ? mapAuthor(a) : null;
}
function mapAuthor(a: NonNullable<Awaited<ReturnType<typeof prisma.author.findFirst>>>) {
  return { ...a, capabilities: j(a.capabilities, {}) as Record<string, boolean>, profile: j(a.profile, {}) as Record<string, unknown> };
}
export async function createAuthor(input: { firstName: string; lastName?: string; profile?: Record<string, unknown>; companyId?: string | null }) {
  await ensureRbacSeed();
  const slug = slugify(`${input.firstName} ${input.lastName ?? ""}`);
  if (await prisma.author.findUnique({ where: { slug } })) return { error: "EXISTS" as const };
  const a = await prisma.author.create({ data: { id: "au-" + slug + "-" + Date.now().toString(36), slug, firstName: input.firstName, lastName: input.lastName ?? "", companyId: input.companyId ?? null, capabilities: "{}", profile: JSON.stringify(input.profile ?? {}) } });
  await audit("Суперадмин", "author.create", slug);
  return { author: mapAuthor(a) };
}
export async function updateAuthor(id: string, patch: Partial<{ firstName: string; lastName: string; avatar: string; verifyStatus: string; companyId: string | null; capabilities: Record<string, boolean>; profile: Record<string, unknown> }>) {
  await ensureRbacSeed();
  const data: Record<string, unknown> = {};
  for (const k of ["firstName", "lastName", "avatar", "verifyStatus", "companyId"] as const) if (patch[k] !== undefined) data[k] = patch[k];
  if (patch.capabilities !== undefined) data.capabilities = JSON.stringify(patch.capabilities);
  if (patch.profile !== undefined) data.profile = JSON.stringify(patch.profile);
  const a = await prisma.author.update({ where: { id }, data: data as never });
  await audit("Суперадмин", "author.update", a.slug);
  return mapAuthor(a);
}
export async function deleteAuthor(id: string) {
  await ensureRbacSeed();
  await prisma.author.delete({ where: { id } });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function listUsers() {
  await ensureRbacSeed();
  return prisma.appUser.findMany({ orderBy: { createdAt: "asc" } });
}
export async function getUserById(id: string) {
  await ensureRbacSeed();
  return prisma.appUser.findUnique({ where: { id } });
}
export async function firstCompany() {
  await ensureRbacSeed();
  const c = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  return c ? mapCompany(c) : null;
}
export async function createUser(input: { name: string; email: string; roleSlug: string; companyId?: string | null; password?: string }) {
  await ensureRbacSeed();
  if (await prisma.appUser.findUnique({ where: { email: input.email } })) return { error: "EXISTS" as const };
  const u = await prisma.appUser.create({ data: { id: "u-" + Date.now().toString(36), name: input.name, displayName: input.name, email: input.email, roleSlug: input.roleSlug, companyId: input.companyId ?? null, passwordHash: input.password ? hashPassword(input.password) : "", emailVerified: true } });
  await audit("Суперадмин", "user.create", input.email);
  return { user: u };
}
export async function updateUser(id: string, patch: Partial<{ status: string; roleSlug: string; companyId: string | null; name: string }>) {
  await ensureRbacSeed();
  const u = await prisma.appUser.update({ where: { id }, data: patch as never });
  await audit("Суперадмин", "user.update", u.email);
  return u;
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export async function audit(actor: string, action: string, target = "") {
  try { await prisma.auditLog.create({ data: { id: "log-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), actor, action, target } }); } catch { /* ignore */ }
}
export async function listAudit() {
  await ensureRbacSeed();
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
}
