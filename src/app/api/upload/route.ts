import { NextResponse } from "next/server";
import { readBody, apiError } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Загрузка медиа на диск (public/uploads) вместо хранения base64 в БД.
// Принимает data-URL, возвращает публичный URL файла. Для self-hosted работает как есть;
// для облака (Vercel/serverless) сюда подставляется S3/Blob — интерфейс тот же.
// SVG намеренно НЕ поддерживается: он может содержать исполняемый <script>
// и, отдаваясь с того же домена, приводит к stored-XSS.
const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/ogg": "ogv",
};

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return apiError("Не авторизован", 401);
  const { dataUrl } = await readBody(req);
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return apiError("Ожидается data-URL.", 422);
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return apiError("Неверный формат data-URL.", 422);
  const ext = EXT[m[1].toLowerCase()];
  if (!ext) return apiError("Неподдерживаемый тип файла.", 415);
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 30 * 1024 * 1024) return apiError("Файл больше 30 МБ.", 413);
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ data: { url: `/uploads/${name}` } });
  } catch {
    return apiError("Не удалось сохранить файл.", 500);
  }
}
