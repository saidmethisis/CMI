// Общая основа для карточек OpenGraph — картинок, которые видно при отправке
// ссылки в Telegram, WhatsApp, Facebook и X.
//
// Почему карточка рисуется, а не берётся готовым файлом: у большинства материалов
// своя обложка, а карточка нужна как запасной вариант — для главной, разделов и
// статей без картинки. Раньше в этом случае в мета-теге стояла пустая строка, и
// мессенджер показывал ссылку голым текстом.
//
// Шрифт лежит в репозитории намеренно: встроенный в генератор Noto Sans знает
// только латиницу, поэтому русские и узбекские заголовки выходили пустыми
// прямоугольниками. Inter (лицензия SIL OFL 1.1) покрывает кириллицу и латиницу.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BRAND = "#14314F";
const BRAND_DEEP = "#081625";
const ACCENT = "#C81E3A";
const GOLD = "#E0A008";

let fontCache: ArrayBuffer | null = null;
async function ogFont(): Promise<ArrayBuffer> {
  // Файл читаем один раз на процесс: карточки запрашивают роботы соцсетей, и
  // лишнее чтение диска на каждый запрос ни к чему.
  if (!fontCache) {
    const buf = await readFile(path.join(process.cwd(), "src", "assets", "Inter-Bold.ttf"));
    fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return fontCache;
}

export function OgCard({ title, kicker, footer }: { title: string; kicker?: string; footer?: string }) {
  // Длинный заголовок в карточке 1200×630 превращается в нечитаемую стену,
  // поэтому кегль зависит от длины, а сам текст обрезается.
  const text = title.length > 150 ? title.slice(0, 149).trimEnd() + "…" : title;
  const size = title.length > 90 ? 52 : title.length > 45 ? 64 : 76;

  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "64px 72px",
        backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DEEP} 100%)`,
        color: "#fff", fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", width: 14, height: 44, background: ACCENT, borderRadius: 4 }} />
        <div style={{ display: "flex", fontSize: 34, letterSpacing: -0.5 }}>Asosiy Aktiv</div>
        {kicker ? (
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 24, color: GOLD, letterSpacing: 1 }}>
            {kicker.slice(0, 40).toUpperCase()}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", fontSize: size, lineHeight: 1.15 }}>{text}</div>

      <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: "rgba(255,255,255,.75)" }}>
        {footer ?? "asosiyaktiv.uz"}
      </div>
    </div>
  );
}

// Отрисовка карточки.
//
// `next/og` подгружается прямо здесь, а не импортом сверху, и вот почему:
// в поставке Next этот пакет собирает пути к своим wasm-файлам через path.join
// поверх file://-адреса. На Windows разделители превращаются в обратные слэши,
// адрес перестаёт быть валидным, и модуль падает ещё при загрузке — а вместе с
// ним и вся сборка. На Linux, где крутится боевой сайт, всё работает.
//
// Поэтому: маршруты объявлены динамическими (сборка их не трогает), импорт
// ленивый, а при сбое отдаём 404. Робот соцсети тогда просто покажет ссылку без
// картинки — это честнее, чем отдать битый файл под видом изображения.
export async function renderOg(card: ReactElement): Promise<Response> {
  try {
    const { ImageResponse } = await import("next/og");
    const res = new ImageResponse(card, {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: await ogFont(), style: "normal", weight: 700 }],
    });
    // Картинку дочитываем целиком здесь, а не отдаём потоком. ImageResponse
    // возвращается мгновенно, а сама отрисовка идёт уже внутри потока — ошибка
    // там обрушивает соединение мимо любого try/catch. Полтораста килобайт в
    // памяти дешевле, чем оборванный ответ.
    const png = await res.arrayBuffer();
    return new Response(png, {
      headers: {
        "content-type": OG_CONTENT_TYPE,
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    console.error("OG-карточка не отрисована —", (e as Error).message);
    return new Response(null, { status: 404 });
  }
}
