import { serverT, langAlternates } from "@/lib/i18n-server";
import { getBankRates } from "@/lib/bank-rates";
import { getStockQuotes } from "@/lib/stock";
import RatesBoard from "@/components/RatesBoard";
import BankRates from "@/components/BankRates";
import StockBoard from "@/components/StockBoard";
import CurrencyWidget from "@/components/CurrencyWidget";
import WeatherCard from "@/components/WeatherCard";
import CryptoTable from "@/components/CryptoTable";

// «Цифры» из нижней навигации (ТЗ, блок 1.2) — дата-центр площадки.
// Собирает в одном месте всё числовое, что раньше было разбросано по главной:
// официальный курс ЦБ, курсы в банках, котировки биржи, криптовалюты, погода.
//
// Табло полётов в ТЗ есть, но источник данных не назван. Пустую таблицу
// показывать нельзя — на финансовом разделе это читается как поломка,
// поэтому блок объявлен честно и включится, когда появится источник.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("num.title"), description: t("num.subtitle"), alternates: await langAlternates("/numbers") };
}

export default async function NumbersPage() {
  const { t } = await serverT();
  const soft = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };
  const bankRates = await soft(getBankRates, { data: {}, updatedAt: "", source: "unavailable" });
  const stock = await soft(getStockQuotes, { data: [], updatedAt: "", source: "unavailable" });

  return (
    <div className="container-content py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("num.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("num.subtitle")}</p>

      <div className="space-y-6">
        <RatesBoard />
        <BankRates initial={bankRates} />
        <StockBoard initial={stock} />

        <div className="grid gap-6 md:grid-cols-2">
          <CurrencyWidget />
          <WeatherCard />
        </div>

        <CryptoTable />

        {/* Табло полётов — место занято, данные ждут источника. */}
        <section className="card p-5" aria-label={t("num.flights")}>
          <h2 className="font-serif text-lg font-bold">{t("num.flights")}</h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/65">{t("num.flightsSoon")}</p>
        </section>
      </div>
    </div>
  );
}
