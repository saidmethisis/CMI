import Link from "next/link";
import { adminMetrics } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("ad2.metaFinance") };
}
export const dynamic = "force-dynamic";

export default async function AdminFinance() {
  const m = await adminMetrics();
  const { t } = await serverT();

  // Реальная тарифная сетка (продуктовое предложение). Биллинг (оплаты/инвойсы/
  // эквайринг) — на продакшене; фейковых цифр и кнопок-пустышек здесь нет.
  const tiers = [
    { name: "Standard", price: `990 000 ${t("fc.perMonth")}`, articles: `3 / ${t("ad2.moShort")}`, ai: t("ad2.aiBasic") },
    { name: "Premium", price: `2 490 000 ${t("fc.perMonth")}`, articles: `10 / ${t("ad2.moShort")}`, ai: t("ad2.aiExtended") },
    { name: "Partner", price: t("fc.byContract"), articles: t("ad2.unlimited"), ai: t("ad2.aiFull") },
  ];

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">{t("adm.finance")}</h1>
      <p className="mb-5 max-w-2xl text-sm text-black/60 dark:text-white/65">
        {t("ad2.finIntro")}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.companies}</div><div className="text-xs text-black/60 dark:text-white/65">{t("ad2.finCompanies")}</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.published.toLocaleString("ru-RU")}</div><div className="text-xs text-black/60 dark:text-white/65">{t("ad2.finPublished")}</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.authors}</div><div className="text-xs text-black/60 dark:text-white/65">{t("dash.mAuthors")}</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.users}</div><div className="text-xs text-black/60 dark:text-white/65">{t("dash.mUsers")}</div></div>
      </div>

      <h2 className="mb-3 font-semibold">{t("ad2.plansForCompanies")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.name} className="card p-5">
            <h3 className="font-serif text-lg font-bold">{tier.name}</h3>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">{tier.price}</div>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-black/60 dark:text-white/65">{t("ad2.publicationsCount")}</dt><dd className="font-medium">{tier.articles}</dd></div>
              <div className="flex justify-between"><dt className="text-black/60 dark:text-white/65">{t("ad2.aiSupport")}</dt><dd className="font-medium">{tier.ai}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5 text-sm text-black/60 dark:text-white/70">
        {t("ad2.finNote1")}{" "}
        <Link href="/admin/users" className="text-accent hover:underline">{t("anav.users")} → {t("anav.accreditation")}</Link>. {t("ad2.finNote2")}
      </div>
    </div>
  );
}
