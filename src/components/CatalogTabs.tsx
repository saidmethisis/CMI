"use client";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import Cover from "./Cover";

// Вкладки «Компании» и «Авторы» для сводного экрана «Главное» (ТЗ, блок 1.2).
// Критичное добавление по заданию: с главной должен быть вход и в каталог
// бизнеса, и к UGC-авторам.
//
// Данные приходят готовыми с сервера — вкладки только переключают показ,
// поэтому переключение мгновенное и не делает запросов.
export type CompanyCard = { slug: string; name: string; verified: boolean; about: string; logo: string; materials: number };
export type AuthorCard = { slug: string; name: string; avatar: string; verified: boolean; position: string; materials: number };

export default function CatalogTabs({ companies, authors }: { companies: CompanyCard[]; authors: AuthorCard[] }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"companies" | "authors">("companies");
  if (!companies.length && !authors.length) return null;

  const tabs = [
    { key: "companies" as const, label: t("main.companies"), count: companies.length },
    { key: "authors" as const, label: t("main.authors"), count: authors.length },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex border-b border-black/5 dark:border-white/10" role="tablist">
        {tabs.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === x.key}
            onClick={() => setTab(x.key)}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              tab === x.key ? "border-b-2 border-accent text-accent" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            }`}
          >
            {x.label} <span className="text-xs font-semibold opacity-60">{x.count}</span>
          </button>
        ))}
      </div>

      <div className="divide-y divide-black/5 p-2 dark:divide-white/10">
        {tab === "companies"
          ? companies.slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/companies/${c.slug}`} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-black/[0.03] dark:hover:bg-white/5">
                {c.logo && <Cover src={c.logo} alt="" width={80} height={80} sizes="40px" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate font-semibold">
                    {c.name}
                    {c.verified && <span className="chip !border-up/40 !px-1.5 !py-0 text-[10px] text-up">✓</span>}
                  </span>
                  {c.about && <span className="block truncate text-xs text-black/60 dark:text-white/65">{c.about}</span>}
                </span>
                <span className="shrink-0 text-xs text-black/55 dark:text-white/55">{c.materials}</span>
              </Link>
            ))
          : authors.slice(0, 6).map((a) => (
              <Link key={a.slug} href={`/author/${a.slug}`} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-black/[0.03] dark:hover:bg-white/5">
                {a.avatar && <Cover src={a.avatar} alt="" width={80} height={80} sizes="40px" className="h-10 w-10 shrink-0 rounded-full object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate font-semibold">
                    {a.name}
                    {a.verified && <span className="chip !border-up/40 !px-1.5 !py-0 text-[10px] text-up">✓</span>}
                  </span>
                  {a.position && <span className="block truncate text-xs text-black/60 dark:text-white/65">{a.position}</span>}
                </span>
                <span className="shrink-0 text-xs text-black/55 dark:text-white/55">{a.materials}</span>
              </Link>
            ))}
      </div>

      <div className="border-t border-black/5 px-4 py-2.5 text-center dark:border-white/10">
        <Link href={tab === "companies" ? "/companies" : "/authors"} className="text-sm font-semibold text-accent hover:underline">
          {tab === "companies" ? t("co.title") : t("au.title")} →
        </Link>
      </div>
    </section>
  );
}
