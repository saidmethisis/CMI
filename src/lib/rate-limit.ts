// Ограничение частоты запросов.
//
// До этого лимит стоял только на входе, а регистрация, восстановление пароля,
// комментарии, жалобы, подписки и загрузка файлов не были ограничены ничем:
// один аккаунт мог завалить базу комментариями, засыпать чужой ящик письмами
// (сжигая заодно лимит Resend) и залить диск файлами по 30 МБ.
//
// Счётчики живут в памяти процесса: они не переживают перезапуск и не общие для
// нескольких инстансов. Для одного контейнера этого достаточно; при масштабировании
// на несколько инстансов счётчики нужно вынести в Redis.
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = g.__rateBuckets ?? (g.__rateBuckets = new Map());

// Раз в 5 минут выбрасываем протухшие корзины, чтобы карта не росла бесконечно.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}

export type RateRule = { limit: number; windowMs: number };

export const RATE = {
  register: { limit: 5, windowMs: 60 * 60_000 },      // 5 регистраций в час с адреса
  forgot: { limit: 5, windowMs: 60 * 60_000 },        // 5 писем восстановления в час
  comment: { limit: 15, windowMs: 10 * 60_000 },      // 15 комментариев за 10 минут
  report: { limit: 10, windowMs: 60 * 60_000 },       // 10 жалоб в час
  follow: { limit: 60, windowMs: 10 * 60_000 },       // 60 подписок за 10 минут
  upload: { limit: 30, windowMs: 60 * 60_000 },       // 30 файлов в час
  ai: { limit: 10, windowMs: 60 * 60_000 },           // 10 AI-генераций в час
} as const satisfies Record<string, RateRule>;

// Ключ по IP: для анонимных действий (регистрация, восстановление).
export async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

// Возвращает { ok: false, retryAfter } когда лимит исчерпан.
export function hit(bucketKey: string, rule: RateRule): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(bucketKey);
  if (!b || b.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true };
  }
  if (b.count >= rule.limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

// Готовый 429-ответ.
export function tooMany(retryAfter: number) {
  return Response.json(
    { error: { code: "RATE_LIMITED", message: "Слишком часто. Попробуйте позже." } },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// Удобная обёртка: проверка + готовый ответ. `scope` — что ограничиваем,
// `id` — по кому считаем (id пользователя или IP).
export async function guardRate(scope: keyof typeof RATE, id?: string) {
  const who = id ?? (await clientKey());
  const r = hit(`${scope}:${who}`, RATE[scope]);
  return r.ok ? null : tooMany(r.retryAfter);
}
