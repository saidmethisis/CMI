"use client";
import Link from "next/link";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import ScrollRow from "./ScrollRow";

export default function HomeChips() {
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t } = useI18n();
  return (
    <ScrollRow gap="gap-2" className="-mx-4 items-center px-4 py-1 sm:mx-0 sm:px-0 md:pr-16">
      <span className="chip shrink-0 bg-brand text-white">{t("home.all")}</span>
      {categories.map((c) => (
        <Link key={c.slug} href={`/category/${c.slug}`} className="chip shrink-0 hover:bg-black/5 dark:hover:bg-white/10">{catName(c)}</Link>
      ))}
    </ScrollRow>
  );
}
