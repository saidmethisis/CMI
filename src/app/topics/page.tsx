import Link from "next/link";
import { getCategories, categoryCounts } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import CatMark from "@/components/CatMark";

export const metadata = { title: "Темы" };
export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const [{ t, lang }, categories, counts] = await Promise.all([serverT(), getCategories(), categoryCounts()]);
  return (
    <div className="container-content py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("topics.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("topics.subtitle")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="card card-hover flex items-center gap-4 p-5">
            <CatMark cat={c} size={56} className="!rounded-xl" />
            <div>
              <div className="font-serif text-lg font-bold">{localizeName(lang, c)}</div>
              <div className="text-sm text-black/50 dark:text-white/50">{counts[c.slug] ?? 0} {t("common.materials")}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
