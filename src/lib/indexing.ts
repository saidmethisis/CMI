// Мгновенное уведомление Google о новой или удалённой публикации
// (Google Indexing API). Обычный обход занимает от часов до суток — для
// новостей это разница между «прочитали» и «поздно».
//
// Как включить (делается один раз, на вашей стороне):
//   1. Google Cloud Console → создать проект → включить «Indexing API».
//   2. Создать сервисный аккаунт, скачать ключ в формате JSON.
//   3. Google Search Console → домен сайта → «Пользователи и разрешения» →
//      добавить client_email из этого JSON как ВЛАДЕЛЬЦА. Без этого шага API
//      отвечает 403: Google должен убедиться, что сайт ваш.
//   4. Положить содержимое JSON в переменную GOOGLE_INDEXING_CREDENTIALS.
//
// Пока переменная не задана, модуль молча ничего не делает — публикация статей
// работает как работала. Ошибки уведомления никогда не должны ломать публикацию,
// поэтому всё внутри обёрнуто в try/catch и логируется, а не пробрасывается.
//
// Квота по умолчанию — 200 адресов в сутки на проект.
import { createSign } from "node:crypto";
import { SITE_URL } from "./site";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";

type Creds = { email: string; key: string };

function creds(): Creds | null {
  const raw = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (raw) {
    try {
      const j = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) return { email: j.client_email, key: j.private_key };
    } catch {
      console.error("GOOGLE_INDEXING_CREDENTIALS: не разобрался JSON — уведомление Google отключено");
      return null;
    }
  }
  const email = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const key = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  // В .env перевод строки часто хранится как «\n» — возвращаем настоящий,
  // иначе ключ не читается.
  return email && key ? { email, key: key.replace(/\\n/g, "\n") } : null;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

// Сервисный аккаунт обменивает подписанный им JWT на access-token.
async function accessToken(c: Creds): Promise<string | null> {
  const g = globalThis as unknown as { __idxToken?: { token: string; exp: number } };
  // Токен живёт час; берём с запасом в минуту, чтобы не попасть на истечение
  // ровно в момент запроса.
  if (g.__idxToken && g.__idxToken.exp > Date.now() + 60_000) return g.__idxToken.token;

  const iat = Math.floor(Date.now() / 1000);
  const claim = { iss: c.email, scope: SCOPE, aud: TOKEN_URL, exp: iat + 3600, iat };
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claim))}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(c.key);
  const jwt = `${unsigned}.${sig.toString("base64url")}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error("Google Indexing: не выдан токен —", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) return null;
  g.__idxToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function publish(url: string, type: "URL_UPDATED" | "URL_DELETED", token: string) {
  const res = await fetch(PUBLISH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) console.error("Google Indexing:", type, url, "→", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

/**
 * Сообщить Google об изменении адресов. Ничего не бросает и ничего не ждёт от
 * вызывающего кода: публикация статьи не должна зависеть от доступности Google.
 */
export async function pingIndexing(paths: string[], type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") {
  const c = creds();
  if (!c || paths.length === 0) return { sent: 0, skipped: true };
  // На localhost уведомлять бессмысленно: робот туда не дойдёт, а квота спишется.
  if (!SITE_URL.startsWith("https://")) return { sent: 0, skipped: true };
  try {
    const token = await accessToken(c);
    if (!token) return { sent: 0, skipped: true };
    const results = await Promise.all(paths.map((p) => publish(`${SITE_URL}${p}`, type, token).catch(() => false)));
    return { sent: results.filter(Boolean).length, skipped: false };
  } catch (e) {
    console.error("Google Indexing: уведомление не отправлено —", (e as Error).message);
    return { sent: 0, skipped: true };
  }
}

/**
 * Адреса статьи во всех языковых версиях. Узбекская и английская версии — это
 * отдельные страницы для поисковика (см. префиксы /uz/ и /en/), поэтому они
 * должны попадать в индекс вместе с основной.
 */
export function articlePaths(slug: string, langs: string[] = []): string[] {
  return [`/article/${slug}`, ...langs.filter((l) => l === "uz" || l === "en").map((l) => `/${l}/article/${slug}`)];
}
