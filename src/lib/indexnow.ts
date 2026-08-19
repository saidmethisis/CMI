import { SITE_URL } from "./site";

// Мгновенное уведомление Яндекса и Bing о новых материалах — протокол IndexNow.
//
// Зачем: обычный обход новостного сайта занимает от часов до суток. Для новости
// это разница между «прочитали» и «поздно». У Google для этого есть Indexing
// API (см. indexing.ts), у Яндекса своего интерфейса нет — но он принимает
// IndexNow, как и Bing. Аккаунта и подтверждения прав не требуется: достаточно
// выложить на сайте файл с ключом, чтобы поисковик убедился, что адрес наш.
//
// Как включить: задайте INDEXNOW_KEY — строку из 8–128 знаков (латиница и
// цифры). Ключ отдаётся по адресу /indexnow-key.txt, его же мы указываем в
// запросе полем keyLocation. Пока переменная пуста, модуль молча ничего не
// делает — публикация работает как работала.
//
// Ошибки уведомления никогда не должны ломать публикацию, поэтому всё внутри
// try/catch: не смогли сообщить — записали в журнал и пошли дальше.

const ENDPOINT = "https://api.indexnow.org/indexnow";
export const KEY_PATH = "/indexnow-key.txt";
// Протокол принимает не больше 10 000 адресов за раз.
const MAX_URLS = 10000;

export function indexNowKey(): string | null {
  const k = (process.env.INDEXNOW_KEY || "").trim();
  if (!k) return null;
  if (!/^[A-Za-z0-9-]{8,128}$/.test(k)) {
    console.error("INDEXNOW_KEY: допустимы 8–128 знаков латиницы, цифр и дефиса — уведомление отключено");
    return null;
  }
  return k;
}

/**
 * Сообщает поисковикам об изменившихся адресах.
 * Возвращает, что произошло, — для журнала и тестов.
 */
export async function submitIndexNow(paths: string[]): Promise<{ sent: number; skipped: boolean; status?: number }> {
  const key = indexNowKey();
  if (!key) return { sent: 0, skipped: true };

  const site = new URL(SITE_URL);
  // Локальные адреса поисковику недоступны — проверять их бессмысленно.
  if (site.protocol !== "https:" || /localhost|127\.0\.0\.1/.test(site.hostname)) return { sent: 0, skipped: true };

  const urlList = [...new Set(paths)].slice(0, MAX_URLS).map((p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`));
  if (!urlList.length) return { sent: 0, skipped: true };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: site.hostname, key, keyLocation: `${SITE_URL}${KEY_PATH}`, urlList }),
    });
    // 200 — принято, 202 — принято и поставлено в очередь на проверку ключа.
    if (res.status !== 200 && res.status !== 202) {
      console.error(`IndexNow: ${res.status} для ${urlList.length} адресов`);
    }
    return { sent: urlList.length, skipped: false, status: res.status };
  } catch (e) {
    console.error("IndexNow: не удалось отправить —", (e as Error).message);
    return { sent: 0, skipped: false };
  }
}
