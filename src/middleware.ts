import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSRF-защита: для мутирующих запросов к /api/* сверяем Origin с хостом сайта.
// Браузерный кросс-сайт POST/PATCH/DELETE будет иметь чужой Origin → 403.
// Запросы без Origin (не из браузера: curl, серверные) пропускаем — их прикрывает
// SameSite=Lax на сессионной cookie.
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Хост берём из конфигурации, а не из заголовков запроса.
// Раньше в список разрешённых попадал X-Forwarded-Host — заголовок, который
// присылает сам клиент. Достаточно было отправить «Origin: https://evil» вместе
// с «X-Forwarded-Host: evil», и проверка проходила: защита сводилась к нулю.
const CONFIGURED_HOST = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  try { return raw ? new URL(raw).host : ""; } catch { return ""; }
})();

export function middleware(req: NextRequest) {
  if (MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try { originHost = new URL(origin).host; } catch { originHost = ""; }
      // Непарсящийся Origin браузер не отправит — считаем такой запрос подозрительным.
      if (!originHost) {
        return NextResponse.json({ error: { code: "CSRF", message: "Недопустимый источник запроса." } }, { status: 403 });
      }
      // Host заголовок оставляем: за нашим nginx он проксируется как есть
      // (proxy_set_header Host $host), а в dev это localhost:3000.
      const allowed = [req.headers.get("host"), CONFIGURED_HOST].filter(Boolean) as string[];
      if (allowed.length && !allowed.includes(originHost)) {
        return NextResponse.json({ error: { code: "CSRF", message: "Недопустимый источник запроса." } }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
