import Link from "next/link";
import { getCompany, firstCompany } from "@/lib/rbac-store";
import { COMPANY_SECTIONS, COMPANY_CAPABILITIES, canAccessAdmin } from "@/lib/permissions";
import { articlesByCompany, commentsByCompany, companyAuthors, getCategories } from "@/lib/store";
import { requirePermission } from "@/lib/guard";
import { serverT } from "@/lib/i18n-server";
import CompanyDemoSections from "./CompanyDemoSections";
import CompanyNav from "./CompanyNav";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("menu.cabCompany") };
}

// Какой кабинет показывать. Определяется ТОЛЬКО серверными данными сессии.
//
// Раньше здесь читалась cookie `aktiv_impersonate` и по её userId выбиралась компания.
// Cookie не httpOnly, то есть её мог подставить любой пользователь из консоли браузера
// и открыть кабинет чужой компании вместе с её неопубликованными материалами.
// Теперь имперсонализация выдаёт настоящую сессию (см. /api/admin/login-as), поэтому
// currentUser() уже возвращает нужного пользователя и его companyId — подмена не нужна.
async function resolveCompany(userCompanyId: string | null, isAdmin: boolean) {
  if (userCompanyId) { const co = await getCompany(userCompanyId); if (co) return co; }
  // Фолбэк на «первую компанию» — только для админа (например, суперадмин
  // заглядывает в кабинет). Обычный пользователь без своей компании не должен
  // проваливаться в чужую.
  return isAdmin ? firstCompany() : null;
}

export default async function CompanyCabinet() {
  const { user, perms } = await requirePermission("ads.view", "/company");
  const { t, lang } = await serverT();
  const company = await resolveCompany(user?.companyId ?? null, canAccessAdmin(perms));
  if (!company) {
    return <div className="container-content py-10 text-center text-black/60">{t("misc.companyNotFound")}</div>;
  }
  const sections = COMPANY_SECTIONS.filter((s) => company.sections.includes(s.key));
  // COMPANY_SECTIONS labels are i18n keys (see src/lib/permissions.ts) — translate them.
  const secLabel = (key: string, fallback: string) => { const v = t(`co.${key}`); return v === `co.${key}` ? t(fallback) : v; };
  const sectionKeys = sections.map((s) => s.key);
  const enabledCaps = COMPANY_CAPABILITIES.filter((c) => company.capabilities[c.key]);
  const news = await articlesByCompany(company.name);
  const comments = await commentsByCompany(company.name);
  const authors = await companyAuthors(company.id);
  const cats = await getCategories();
  const p = company.profile as Record<string, string>;

  // ── реальные данные компании (из её материалов) ──────────────────────────────
  const cstats = {
    total: news.length,
    published: news.filter((a) => a.status === "published").length,
    review: news.filter((a) => a.status === "review" || a.status === "returned").length,
    views: news.reduce((s, a) => s + a.views, 0),
  };
  const topArts = [...news].sort((a, b) => b.views - a.views).slice(0, 5)
    .map((a) => ({ slug: a.slug, title: a.title, views: a.views, status: a.status }));
  const catAgg = new Map<string, { count: number; views: number }>();
  for (const a of news) {
    const cur = catAgg.get(a.categorySlug) ?? { count: 0, views: 0 };
    cur.count++; cur.views += a.views; catAgg.set(a.categorySlug, cur);
  }
  const catBreakdown = [...catAgg.entries()]
    .map(([slug, v]) => ({ name: cats.find((c) => c.slug === slug)?.name ?? slug, count: v.count, views: v.views }))
    .sort((a, b) => b.views - a.views);
  const press = news.filter((a) => a.authorKind === "pr");
  const realPress = (press.length ? press : news.filter((a) => a.status === "published"))
    .slice(0, 8).map((a) => ({ slug: a.slug, title: a.title, date: a.createdAt, status: a.status }));
  const companyData = { stats: cstats, topArts, catBreakdown, press: realPress, authors };

  return (
    <div className="container-content grid gap-6 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">{company.name.charAt(0)}</span>
          <div><div className="text-sm font-bold">{company.name}</div><div className="text-[11px] text-black/60 dark:text-white/65">{t("co.cabinet")}</div></div>
        </div>
        <CompanyNav items={sections.map((s) => ({ key: s.key, label: secLabel(s.key, s.label) }))} />
        <p className="mt-3 px-2 text-[11px] text-black/60 dark:text-white/65">{t("co.setBy")}</p>
      </aside>

      <section className="space-y-5">
        {sections.some((s) => s.key === "dashboard") && (
          <div id="dashboard">
            <div className="mb-3 flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold">{company.name}</h1>
              {company.verified && <span className="chip !border-up/40 !py-0.5 text-up">{t("co.verified")}</span>}
              {company.premium && <span className="chip !py-0.5">Premium</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[t("co.mNews"), news.length], [t("co.mViews"), news.reduce((s, a) => s + a.views, 0).toLocaleString("ru-RU")], [t("co.mSections"), sections.length], [t("co.mCaps"), enabledCaps.length]].map(([l, v]) => (
                <div key={l as string} className="card p-4"><div className="text-2xl font-bold tabular-nums">{v}</div><div className="text-xs text-black/60 dark:text-white/65">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {sections.some((s) => s.key === "news") && (
          <div id="news" className="card p-5">
            <h2 className="mb-3 font-semibold">{t("co.news")}</h2>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {news.length === 0 && <p className="text-sm text-black/60">{t("co.noNews")}</p>}
              {news.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1">{a.title}</span>
                  <span className="chip !py-0.5 text-[11px]">{t(`status.${a.status}`)}</span>
                  {a.status === "published" && <Link href={`/article/${a.slug}`} className="btn-ghost text-xs">{t("co.open")}</Link>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* sample/demo content for every other enabled section */}
        <CompanyDemoSections keys={sectionKeys} t={t} lang={lang} comments={comments} companyId={company.id} data={companyData} />

        <div className="card p-5">
          <h2 className="mb-2 font-semibold">{t("co.profile")}</h2>
          <p className="text-sm text-black/60 dark:text-white/70">{p.description || "—"}</p>
          <div className="mt-2 text-xs text-black/60 dark:text-white/65">{[p.city, p.country, p.website].filter(Boolean).join(" · ")}</div>
        </div>
      </section>
    </div>
  );
}
