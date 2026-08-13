"use client";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import { useI18n } from "@/lib/i18n";
import SaveButton from "./SaveButton";
import Cover from "@/components/Cover";

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
      <div className={`relative w-full overflow-hidden bg-black/[0.06] dark:bg-white/[0.08] ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {/* Без обложки показываем нейтральную заглушку, а не случайное стоковое фото:
            чужая картинка к чужому тексту вводит читателя в заблуждение. */}
        {a.cover ? (
          <Cover src={a.cover} alt={a.title} width={800} height={450} sizes="(max-width: 768px) 100vw, 400px" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="grid h-full w-full place-items-center font-serif text-3xl font-bold text-black/15 dark:text-white/15">A</span>
        )}
        {a.authorKind === "pr" && (
          <span className="absolute right-3 top-3 chip !border-0 bg-gold text-white">{t("ads.sponsored")}</span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color: cat?.color }}>{cat ? catName(cat) : ""}</span>
          <span className="text-black/60 dark:text-white/65">· {a.readingMinutes} {t("common.min")}</span>
        </div>
        {/* stretched link: makes the whole card clickable + hover styling like a link */}
        <h3 className={`line-clamp-3 font-serif font-bold leading-snug transition-colors group-hover:text-accent group-hover:underline ${large ? "text-2xl" : "text-lg"}`}>
          <Link href={`/n/${a.slug}`} className="after:absolute after:inset-0 after:z-0">{a.title}</Link>
        </h3>
        {/* compact teaser/summary line for every article */}
        <p className="mt-2 line-clamp-2 text-sm text-black/60 transition-colors group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">{a.lead}</p>
        {/* min-w-0 + truncate на имени и shrink-0 на кнопке: без этого длинное имя
            автора распирало строку и выдавливало «Сохранить» за край карточки. */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-black/60 dark:text-white/65">
            <span className="truncate font-medium">{a.company ?? a.authorName}</span>
            <span className="shrink-0 whitespace-nowrap">· {fmtDate(a.createdAt)}</span>
          </div>
          <SaveButton slug={a.slug} className="relative z-10 shrink-0" />
        </div>
      </div>
    </article>
  );
}
