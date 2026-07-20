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
        // За обратным прокси (nginx) исходный хост может приезжать в X-Forwarded-Host,
        // поэтому принимаем совпадение с любым из них — иначе все мутации ловят 403.
        const host = req.headers.get("host");
        const fwdHost = req.headers.get("x-forwarded-host");
        const allowed = [host, fwdHost].filter(Boolean) as string[];
        if (allowed.length && !allowed.includes(originHost)) {
          return NextResponse.json({ error: { code: "CSRF", message: "Недопустимый источник запроса." } }, { status: 403 });
        }
      } catch { /* невалидный Origin — не блокируем */ }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
