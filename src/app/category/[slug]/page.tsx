import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, listPublished } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import { subsectionsFor } from "@/lib/nav";
import CatMark from "@/components/CatMark";
import Feed from "@/components/Feed";
import AdSlot from "@/components/AdSlot";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sub?: string; sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return { title: c?.name ?? "Рубрика" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub, sort } = await searchParams;
  const { t, lang } = await serverT();
  const c = (await getCategories()).find((x) => x.slug === slug);
  if (!c) notFound();
  let items = await listPublished({ category: slug, q: sub || undefined });
  if (sort === "pop") items = [...items].sort((a, b) => b.views - a.views);
  const subs = subsectionsFor(lang)[slug] ?? [];
  const sortHref = (s?: string) => {
    const p = new URLSearchParams();
    if (sub) p.set("sub", sub);
    if (s) p.set("sort", s);
    const qs = p.toString();
    return `/category/${slug}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-content py-6">
      <div className="mb-4 flex items-center gap-3">
        <CatMark cat={c} size={48} className="!rounded-xl" />
        <div>
          <h1 className="font-serif text-3xl font-bold">{localizeName(lang, c)}</h1>
          <p className="text-sm text-black/50 dark:text-white/50">{items.length} {t("common.materials")}{sub ? ` · ${sub}` : ""}</p>
        </div>
        <FollowButton type="topic" id={slug} label="тему" className="ml-auto !py-1.5 text-xs" />
      </div>

      {/* subsection filter chips */}
      {subs.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Link href={`/category/${slug}`} className={`chip ${!sub ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{t("home.all")}</Link>
          {subs.map((s) => (
            <Link key={s} href={`/category/${slug}?sub=${encodeURIComponent(s)}`} className={`chip ${sub === s ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{s}</Link>
          ))}
        </div>
      )}

      {/* sort */}
      <div className="mb-4 flex gap-2 text-sm">
        <Link href={sortHref()} className={`chip ${sort !== "pop" ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{t("category.new")}</Link>
        <Link href={sortHref("pop")} className={`chip ${sort === "pop" ? "bg-brand text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>{t("category.popular")}</Link>
      </div>

      <AdSlot zone="leaderboard" />
      <div className="mt-5">
        {items.length ? (
          <Feed items={items} />
        ) : (
          <div className="py-10 text-center">
            <p className="text-black/50 dark:text-white/50">{sub ? t("category.noFilter") : t("category.noMaterials")}</p>
            {sub && <Link href={`/category/${slug}`} className="btn-ghost mt-3 inline-flex text-sm">{t("category.reset")}</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
