// Загружает data-URL на сервер и возвращает публичный URL файла.
// Если загрузка не удалась — откатывается на исходный data-URL (ничего не ломается).
export async function uploadDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
    const j = await r.json();
    return r.ok && j.data?.url ? j.data.url : dataUrl;
  } catch {
    return dataUrl;
  }
}

// Читает File в data-URL (base64) целиком.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Уменьшает большие изображения перед загрузкой: телефонные фото часто 3000–4000px и
// несколько МБ; порталу не нужно больше ~1920px. Пережимаем в WebP/JPEG на клиенте —
// это в разы уменьшает размер и время загрузки. GIF/анимацию не трогаем.
async function compressDataUrl(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  const img = document.createElement("img");
  img.decoding = "async";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("decode"));
    img.src = dataUrl;
  });
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  // если картинка уже маленькая — не трогаем
  if (scale >= 1 && dataUrl.length < 900_000) return dataUrl;
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, cw, ch);
  const out = canvas.toDataURL("image/webp", quality);
  // некоторые окружения не умеют webp из canvas — падаем на jpeg
  return out.startsWith("data:image/webp") ? out : canvas.toDataURL("image/jpeg", quality);
}

// Полный путь для картинок в редакторе: File → сжатие → загрузка на диск → публичный URL.
export async function imageFileToUrl(
  file: File,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  if (!file.type.startsWith("image/") || file.type === "image/gif") return uploadDataUrl(dataUrl);
  let compact = dataUrl;
  try {
    compact = await compressDataUrl(dataUrl, opts.maxDim ?? 1920, opts.quality ?? 0.82);
  } catch {
    /* при любой ошибке сжатия грузим оригинал */
  }
  return uploadDataUrl(compact);
}
