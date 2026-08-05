import { OgCard, renderOg } from "@/lib/og";
import { guardRate } from "@/lib/rate-limit";

// Карточка сайта для соцсетей: /og
//
// Это обычный обработчик маршрута, а не файл opengraph-image.tsx. Причина в
// комментарии к renderOg: генератор картинок не запускается на Windows, и своя
// обработка ошибок нужна, чтобы разработка на этой машине не упиралась в пустой
// ответ сервера. У файлового соглашения Next такой возможности нет — он
// подключает генератор сам, в обход нашего try/catch.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Отрисовка карточки — это работа процессора на каждый запрос, поэтому она
  // ограничена по частоте: иначе адрес превращается в удобную мишень.
  const limited = await guardRate("og");
  if (limited) return limited;

  return renderOg(
    <OgCard title="Деловое медиа нового поколения" kicker="Asosiy Aktiv" footer="Бизнес · Технологии · Дипломатия · Политика" />,
  );
}
