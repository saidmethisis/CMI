"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/dictionaries";

// Corporate-only offering (no reader subscription). Companies buy PR + AI + placement.
type Plan = { name: string; price: string; articles: string; ai: string; featured?: boolean; features: string[] };
const PLANS: Record<Lang, Plan[]> = {
  ru: [
    { name: "Standard", price: "990 000", articles: "3 материала / мес", ai: "Базовый AI", features: ["PR-кабинет", "AI-генерация (базовая)", "Модерация редакцией", "Brand Hub"] },
    { name: "Premium", price: "2 490 000", articles: "10 материалов / мес", ai: "Расширенный AI", featured: true, features: ["Всё из Standard", "Расширенная AI-генерация", "Приоритетная модерация", "Экспорт в JSON для чат-ботов", "Аналитика по материалам"] },
    { name: "Partner", price: "contract", articles: "Безлимит", ai: "Полный AI + API", features: ["Всё из Premium", "Спонсорские спецпроекты", "Нативные интеграции", "Персональный менеджер", "API-доступ"] },
  ],
  en: [
    { name: "Standard", price: "990 000", articles: "3 articles / mo", ai: "Basic AI", features: ["PR cabinet", "AI generation (basic)", "Editorial moderation", "Brand Hub"] },
    { name: "Premium", price: "2 490 000", articles: "10 articles / mo", ai: "Advanced AI", featured: true, features: ["Everything in Standard", "Advanced AI generation", "Priority moderation", "JSON export for chatbots", "Article analytics"] },
    { name: "Partner", price: "contract", articles: "Unlimited", ai: "Full AI + API", features: ["Everything in Premium", "Sponsored specials", "Native integrations", "Personal manager", "API access"] },
  ],
  uz: [
    { name: "Standard", price: "990 000", articles: "3 material / oy", ai: "Bazaviy AI", features: ["PR kabinet", "AI generatsiya (bazaviy)", "Tahririyat moderatsiyasi", "Brand Hub"] },
    { name: "Premium", price: "2 490 000", articles: "10 material / oy", ai: "Kengaytirilgan AI", featured: true, features: ["Standarddagi hammasi", "Kengaytirilgan AI generatsiya", "Ustuvor moderatsiya", "Chatbotlar uchun JSON eksport", "Materiallar tahlili"] },
    { name: "Partner", price: "contract", articles: "Cheksiz", ai: "To'liq AI + API", features: ["Premiumdagi hammasi", "Homiylik loyihalari", "Native integratsiyalar", "Shaxsiy menejer", "API kirish"] },
  ],
};

export default function ForCompaniesPage() {
  const { t, lang } = useI18n();
  const plans = PLANS[lang] ?? PLANS.ru;
  return (
    <div className="container-content py-8">
      <div className="text-center">
        <span className="chip mx-auto">{t("fc.badge")}</span>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">{t("fc.title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-black/60 dark:text-white/60">{t("fc.subtitle")}</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`card relative flex flex-col p-6 ${p.featured ? "ring-2 ring-brand" : ""}`}>
            {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">{t("fc.popular")}</span>}
            <h3 className="font-serif text-xl font-bold">{p.name}</h3>
            <div className="mt-2 text-3xl font-bold tabular-nums">{p.price === "contract" ? "—" : p.price}<span className="text-sm font-normal text-black/50 dark:text-white/50"> {p.price === "contract" ? t("fc.byContract") : t("fc.perMonth")}</span></div>
            <div className="mt-1 text-sm text-black/55 dark:text-white/55">{p.articles} · {p.ai}</div>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-up">✓</span>{f}</li>)}
            </ul>
            <Link href="/company" className={`mt-6 ${p.featured ? "btn-accent" : "btn-ghost"} w-full`}>{t("fc.apply")}</Link>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-black/40 dark:text-white/40">{t("fc.note")}</p>
    </div>
  );
}
