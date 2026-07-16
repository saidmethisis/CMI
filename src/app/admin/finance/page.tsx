import Link from "next/link";
import { adminMetrics } from "@/lib/store";

export const metadata = { title: "Admin — Финансы" };
export const dynamic = "force-dynamic";

// Реальная тарифная сетка (продуктовое предложение). Биллинг (оплаты/инвойсы/
// эквайринг) — на продакшене; фейковых цифр и кнопок-пустышек здесь нет.
const tiers = [
  { name: "Standard", price: "990 000 сум/мес", articles: "3 / мес", ai: "Базовый" },
  { name: "Premium", price: "2 490 000 сум/мес", articles: "10 / мес", ai: "Расширенный" },
  { name: "Partner", price: "по договору", articles: "без лимита", ai: "Полный + экспорт" },
];

export default async function AdminFinance() {
  const m = await adminMetrics();

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">Финансы и тарифы</h1>
      <p className="mb-5 max-w-2xl text-sm text-black/50 dark:text-white/50">
        Тарифная сетка для компаний. Приём оплат (эквайринг Payme/Click/Uzum, банковские переводы, инвойсы) подключается на продакшене — здесь показаны условия тарифов и текущее число компаний.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.companies}</div><div className="text-xs text-black/45 dark:text-white/45">Компаний на платформе</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.published.toLocaleString("ru-RU")}</div><div className="text-xs text-black/45 dark:text-white/45">Опубликовано материалов</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.authors}</div><div className="text-xs text-black/45 dark:text-white/45">Авторов</div></div>
        <div className="card p-4"><div className="text-2xl font-bold tabular-nums">{m.users}</div><div className="text-xs text-black/45 dark:text-white/45">Пользователей</div></div>
      </div>

      <h2 className="mb-3 font-semibold">Тарифы для компаний</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className="card p-5">
            <h3 className="font-serif text-lg font-bold">{t.name}</h3>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">{t.price}</div>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-black/50 dark:text-white/50">Публикаций</dt><dd className="font-medium">{t.articles}</dd></div>
              <div className="flex justify-between"><dt className="text-black/50 dark:text-white/50">AI-поддержка</dt><dd className="font-medium">{t.ai}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5 text-sm text-black/60 dark:text-white/70">
        Заявки компаний на подключение тарифа приходят в раздел{" "}
        <Link href="/admin/users" className="text-accent hover:underline">Пользователи → Аккредитация</Link>. Приём платежей и генерацию инвойсов включим при развёртывании биллинга.
      </div>
    </div>
  );
}
