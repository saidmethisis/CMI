import Link from "next/link";
import TrendPanel from "@/components/dash/TrendPanel";
import Sparkline from "@/components/dash/Sparkline";
import { serverT } from "@/lib/i18n-server";

type Metrics = { published: number; pending: number; views: number; comments: number; authors: number; companies: number; users: number; cats: number };
type Top = { id: string; slug: string; title: string; views: number; cat: string }[];
type CatStat = { slug: string; name: string; count: number; views: number; spark: number[] };

// фикс-порядок неоновых цветов (по гайду: категориальные хью в фиксированном порядке)
const NEON = ["#8b5cf6", "#22d3ee", "#ec4899", "#34d399", "#fbbf24", "#60a5fa", "#fb7185", "#2dd4bf"];
const nf = (n: number) => n.toLocaleString("ru-RU");

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>{children}</div>;
}

function Metric({ label, value, color, href }: { label: string; value: string; color: string; href?: string }) {
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</div>
    </>
  );
  const cls = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition";
  return href ? <Link href={href} className={`${cls} block hover:border-white/25 hover:bg-white/[0.06]`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export default async function CampaignBoard({ metrics, top, catStats, labels, pubSeries, viewSeries }: {
  metrics: Metrics; top: Top; catStats: CatStat[]; labels: string[]; pubSeries: number[]; viewSeries: number[];
}) {
  const { t } = await serverT();
  const maxCatViews = Math.max(1, ...catStats.map((c) => c.views));
  const actions = [
    { label: t("anav.moderation"), href: "/admin/moderation", badge: metrics.pending || undefined },
    { label: t("anav.users"), href: "/admin/staff" },
    { label: t("anav.companies"), href: "/admin/companies" },
    { label: t("dash.categories"), href: "/admin/categories" },
    { label: t("anav.ads"), href: "/admin/ads" },
    { label: t("anav.authors"), href: "/admin/authors" },
  ];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#160f2e] via-[#120c26] to-[#0c0a1c] p-4 text-white sm:p-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold">A</span>
        <div>
          <h1 className="font-serif text-xl font-bold">{t("dash.title")}</h1>
          <p className="text-sm text-white/45">{t("dash.subtitle")}</p>
        </div>
        {metrics.pending > 0 && (
          <Link href="/admin/moderation" className="ml-auto rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/25">
            {t("dash.pending")}: {metrics.pending}
          </Link>
        )}
      </div>

      {/* row 1: hero + main chart */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 p-6 lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{t("dash.heroKicker")}</div>
          <h2 className="mt-2 font-serif text-2xl font-extrabold leading-tight">{t("dash.heroTitle")}</h2>
          <p className="mt-2 max-w-xs text-sm text-white/80">{t("dash.heroText")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/moderation" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:brightness-95">{t("dash.moderation")}</Link>
            <Link href="/admin/categories" className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">{t("dash.categories")}</Link>
          </div>
        </div>

        <div className="lg:col-span-3">
          <TrendPanel title={t("dash.viewsByMonth")} total={nf(metrics.views)} labels={labels} values={viewSeries} color="#8b5cf6" />
        </div>
      </div>

      {/* headline metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label={t("dash.mViews")} value={nf(metrics.views)} color="#8b5cf6" />
        <Metric label={t("dash.mPublished")} value={nf(metrics.published)} color="#22d3ee" />
        <Metric label={t("dash.mComments")} value={nf(metrics.comments)} color="#34d399" />
        <Metric label={t("dash.pending")} value={nf(metrics.pending)} color="#fbbf24" href="/admin/moderation" />
      </div>

      {/* row 2: category ticker cards */}
      <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-1">
        {catStats.map((c, i) => {
          const color = NEON[i % NEON.length];
          return (
            <div key={c.slug} className="w-52 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{c.name}
                </span>
                <span className="text-[11px] text-white/45">{c.count} {t("dash.materials")}</span>
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums">{nf(c.views)}</div>
              <div className="mt-2"><Sparkline values={c.spark} color={color} /></div>
            </div>
          );
        })}
      </div>

      {/* row 3: pub chart + quick actions + top materials */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <TrendPanel title={t("dash.pubsByMonth")} total={nf(metrics.published)} labels={labels} values={pubSeries} color="#22d3ee" />

        <Card>
          <h3 className="mb-3 font-semibold">{t("dash.quickActions")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="relative rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.06]">
                {a.label}
                {a.badge && <span className="absolute right-2 top-2 rounded-full bg-amber-400/20 px-1.5 text-[10px] font-bold text-amber-300">{a.badge}</span>}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{t("dash.topMaterials")}</h3>
            <Link href="/admin/moderation" className="text-xs text-violet-300 hover:text-violet-200">{t("dash.all")}</Link>
          </div>
          <div className="divide-y divide-white/5">
            {top.map((a, i) => (
              <Link key={a.id} href={`/article/${a.slug}`} className="flex items-center gap-3 py-2.5 text-sm hover:opacity-80">
                <span className="w-4 text-center font-serif text-base font-bold text-white/30">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1">{a.title}</span>
                  <span className="text-[11px] text-white/40">{a.cat}</span>
                </span>
                <span className="shrink-0 tabular-nums text-white/60">{nf(a.views)}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* row 4: views by category (bars — magnitude) */}
      <Card className="mt-4">
        <h3 className="mb-3 font-semibold">{t("dash.viewsByCat")}</h3>
        <div className="space-y-2.5">
          {catStats.map((c, i) => {
            const color = NEON[i % NEON.length];
            return (
              <div key={c.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums text-white/50">{nf(c.views)} · {c.count} {t("dash.materials")}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, (c.views / maxCatViews) * 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
