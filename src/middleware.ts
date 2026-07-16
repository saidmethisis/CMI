import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSRF-защита: для мутирующих запросов к /api/* сверяем Origin с Host.
// Браузерный кросс-сайт POST/PATCH/DELETE будет иметь чужой Origin → 403.
// Запросы без Origin (не из браузера: curl, серверные) пропускаем.
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  if (MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        const host = req.headers.get("host");
        if (host && originHost !== host) {
          return NextResponse.json({ error: { code: "CSRF", message: "Недопустимый источник запроса." } }, { status: 403 });
        }
      } catch { /* невалидный Origin — не блокируем */ }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
