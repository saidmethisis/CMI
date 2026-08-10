import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getStockQuotes } from "@/lib/stock";

// Маршрут обязан быть динамическим. С одним лишь `revalidate` Next считает его
// пригодным для предрасчёта и выполняет при сборке — а в сборочном контейнере
// ключа биржи нет, и в образ навсегда запекается ответ «данных нет». Страницы
// при этом работают: они рендерятся на каждый запрос и берут котировки сами.
//
// Платному API это ничем не грозит: реальные обращения ограничивает кэш на 15
// минут внутри getStockQuotes, один на весь сайт.
export const dynamic = "force-dynamic";

export const GET = withHandler(async () => {
  const r = await getStockQuotes();
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
});
