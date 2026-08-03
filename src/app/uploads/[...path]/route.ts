import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";

// Отдаёт файлы, загруженные через /api/upload.
//
// Зачем отдельный обработчик: `next start` составляет список public/ ОДИН РАЗ при
// запуске, поэтому файл, загруженный после старта, отдавался как 404 до следующего
// перезапуска — автор загружал обложку, а она не показывалась. Файлы, лежавшие в
// public/ на момент старта, по-прежнему отдаёт статика (она срабатывает раньше),
// а этот маршрут подхватывает всё остальное. Оба варианта URL продолжают работать.

const ROOT = path.join(process.cwd(), "public", "uploads");

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".ogv": "video/ogg",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;

  // Защита от обхода каталога: собираем путь и проверяем, что он не вышел за ROOT.
  // Без этого «..%2F..%2Fetc%2Fpasswd» читал бы произвольные файлы сервера.
  const rel = (parts ?? []).join("/");
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const ext = path.extname(abs).toLowerCase();
  const type = TYPES[ext];
  // Отдаём только известные медиа-типы: сюда не должны попадать .js, .html и т.п.
  if (!type || !existsSync(abs) || !statSync(abs).isFile()) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const stat = statSync(abs);
  const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      // Имя файла — случайный uuid, содержимое по нему никогда не меняется.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
