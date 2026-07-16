"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useTaxonomy, useCatName } from "@/lib/taxonomy";
import LangSwitcher from "./LangSwitcher";
import NewsletterForm from "./NewsletterForm";
import { ORG } from "@/lib/org";

export default function Footer() {
  const { t } = useI18n();
  const { categories } = useTaxonomy();
  const catName = useCatName();

  return (
    <footer className="border-t border-black/5 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
      <div className="container-content grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white">A</span>
            Asosiy Aktiv
          </div>
          <p className="mt-3 max-w-xs text-sm text-black/60 dark:text-white/60">{t("footer.tagline")}</p>
          <div className="mt-4"><LangSwitcher /></div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip">PWA</span>
            <span className="chip">Dark Mode</span>
            <span className="chip">AI PR</span>
            <a href="/feed.xml" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] bg-current text-[7px] font-bold leading-none" aria-hidden><span className="text-[var(--surface)]">R</span></span>
              RSS
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("footer.sections")}</h3>
          <ul className="space-y-2 text-sm text-black/60 dark:text-white/60">
            {categories.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className="hover:text-brand dark:hover:text-white">{catName(c)}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("footer.cabinets")}</h3>
          <ul className="space-y-2 text-sm text-black/60 dark:text-white/60">
            <li><Link href="/for-companies" className="hover:text-brand dark:hover:text-white">{t("footer.forBusiness")}</Link></li>
            <li><Link href="/author-panel" className="hover:text-brand dark:hover:text-white">{t("footer.forAuthors")}</Link></li>
            <li><Link href="/admin" className="hover:text-brand dark:hover:text-white">{t("footer.editorial")}</Link></li>
            <li><Link href="/for-companies" className="hover:text-brand dark:hover:text-white">{t("footer.corporate")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("footer.newsletter")}</h3>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-black/5 dark:border-white/10">
        <div className="container-content flex flex-col gap-2 py-4 text-xs text-black/50 sm:flex-row sm:items-center sm:justify-between dark:text-white/50">
          <span className="flex items-center gap-2">
            <span className="rounded border border-black/20 px-1.5 py-0.5 font-bold text-black/60 dark:border-white/25 dark:text-white/60">{ORG.age}</span>
            © {new Date().getFullYear()} {ORG.name}.
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal">{t("footer.imprint")}</Link>
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
            <a href="/feed.xml" target="_blank" rel="noopener">RSS</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
