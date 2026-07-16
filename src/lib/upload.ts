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
