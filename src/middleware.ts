import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── 1. CSRF для мутирующих запросов к /api/* ─────────────────────────────────
// Браузерный кросс-сайт POST/PATCH/DELETE будет иметь чужой Origin → 403.
// Запросы без Origin (не из браузера: curl, серверные) пропускаем — их прикрывает
// SameSite=Lax на сессионной cookie.
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Хост берём из конфигурации, а не из заголовков запроса.
// Раньше в список разрешённых попадал X-Forwarded-Host — заголовок, который
// присылает сам клиент. Достаточно было отправить «Origin: https://evil» вместе
// с «X-Forwarded-Host: evil», и проверка проходила.
const CONFIGURED_HOST = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  try { return raw ? new URL(raw).host : ""; } catch { return ""; }
})();

// ── 2. Язык в адресе страницы ────────────────────────────────────────────────
// Раньше язык жил ТОЛЬКО в cookie. Поисковый робот cookie не отправляет, поэтому
// он видел исключительно русскую версию: узбекской и английской для поиска не
// существовало вовсе, а hreflang был невозможен — у переводов не было своих адресов.
//
// Теперь у каждого языка свой префикс: /uz/... и /en/... Русский остаётся без
// префикса, чтобы уже существующие ссылки и поисковая выдача не сломались.
// Префикс снимается переписыванием (rewrite), поэтому структура маршрутов
// в src/app не меняется — /uz/article/x рендерит тот же /article/x.
export const LANG_PREFIXES = ["uz", "en"] as const;
export const LANG_HEADER = "x-aktiv-lang";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (MUTATING.has(req.method) && pathname.startsWith("/api/")) {
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
    return NextResponse.next();
  }

  // Языковой префикс — только для страниц, не для API.
  const seg = pathname.split("/")[1];
  const lang = (LANG_PREFIXES as readonly string[]).includes(seg) ? seg : null;
  if (lang) {
    const url = req.nextUrl.clone();
    // /uz → /, /uz/article/x → /article/x
    url.pathname = pathname.slice(lang.length + 1) || "/";
    const headers = new Headers(req.headers);
    headers.set(LANG_HEADER, lang);
    const res = NextResponse.rewrite(url, { request: { headers } });
    // Запоминаем выбор: внутренние ссылки идут без префикса, и без cookie
    // читатель после первого перехода вернулся бы на русский.
    res.cookies.set("aktiv_lang", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Пропускаем статику и файлы: префиксы нужны только страницам и /api (для CSRF).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|icons/|sw.js|manifest.webmanifest|.*\\.[a-zA-Z0-9]+$).*)"],
};
