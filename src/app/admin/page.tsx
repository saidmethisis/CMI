import { adminMetrics, listPublished, getCategories } from "@/lib/store";
import CampaignBoard from "@/components/CampaignBoard";

export const metadata = { title: "Admin — Дашборд" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const m = await adminMetrics();
  const all = await listPublished();
  const cats = await getCategories();

  // ── помесячные корзины за последние 12 месяцев (график умеет 6/12) ───────────
  const N = 12;
  const now = new Date();
  const months = Array.from({ length: N }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (N - 1 - k), 1);
    return { y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString("ru-RU", { month: "short" }) };
  });
  const idxOf = (iso: string) => {
    const d = new Date(iso);
    return months.findIndex((k) => k.y === d.getFullYear() && k.m === d.getMonth());
  };
  const pubSeries = Array(N).fill(0);
  const viewSeries = Array(N).fill(0);
  for (const a of all) {
    const i = idxOf(a.createdAt);
    if (i >= 0) { pubSeries[i]++; viewSeries[i] += a.views; }
  }

  const top = [...all].sort((a, b) => b.views - a.views).slice(0, 6)
    .map((a) => ({ id: a.id, slug: a.slug, title: a.title, views: a.views, cat: cats.find((c) => c.slug === a.categorySlug)?.name ?? "" }));

  // реальная разбивка по рубрикам + помесячный спарклайн публикаций
  const catStats = cats.map((c) => {
    const arts = all.filter((a) => a.categorySlug === c.slug);
    const spark = Array(N).fill(0);
    for (const a of arts) { const i = idxOf(a.createdAt); if (i >= 0) spark[i]++; }
    return { slug: c.slug, name: c.name, count: arts.length, views: arts.reduce((s, a) => s + a.views, 0), spark };
  }).filter((x) => x.count > 0).sort((a, b) => b.views - a.views);

  const metrics = { ...m, cats: catStats.length };
  const labels = months.map((x) => x.label);

  return (
    <CampaignBoard
      metrics={metrics}
      top={top}
      catStats={catStats}
      labels={labels}
      pubSeries={pubSeries}
      viewSeries={viewSeries}
    />
  );
}
