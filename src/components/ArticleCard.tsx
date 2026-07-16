"use client";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import SaveButton from "./SaveButton";

export default function ArticleCard({ a, variant = "M" }: { a: Article; variant?: "L" | "M" | "S" }) {
  const { categories } = useTaxonomy();
  const catName = useCatName();
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "short" });
  const cat = categories.find((c) => c.slug === a.categorySlug);
  const large = variant === "L";

  return (
    <article className={`card card-hover group relative cursor-pointer overflow-hidden ${large ? "sm:col-span-2" : ""}`}>
      <div className={`relative w-full overflow-hidden ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.cover} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {a.authorKind === "pr" && (
          <span className="absolute right-3 top-3 chip !border-0 bg-gold text-white">{t("ads.sponsored")}</span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color: cat?.color }}>{cat ? catName(cat) : ""}</span>
          <span className="text-black/40 dark:text-white/40">· {a.readingMinutes} {t("common.min")}</span>
        </div>
        {/* stretched link: makes the whole card clickable + hover styling like a link */}
        <h3 className={`font-serif font-bold leading-snug transition-colors group-hover:text-accent group-hover:underline ${large ? "text-2xl" : "text-lg"}`}>
          <Link href={`/article/${a.slug}`} className="after:absolute after:inset-0 after:z-0">{a.title}</Link>
        </h3>
        {/* compact teaser/summary line for every article */}
        <p className="mt-2 line-clamp-2 text-sm text-black/60 transition-colors group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">{a.lead}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
            <span className="font-medium">{a.company ?? a.authorName}</span>
            <span>· {fmtDate(a.createdAt)}</span>
          </div>
          <SaveButton slug={a.slug} className="relative z-10" />
        </div>
      </div>
    </article>
  );
}
