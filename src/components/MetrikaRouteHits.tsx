"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Досчёт просмотров при переходах внутри сайта.
//
// Метрика считает страницу один раз — при загрузке скрипта. Но Next меняет
// страницы без перезагрузки: читатель уходит с главной в статью, оттуда в
// другую, а в отчётах всё это остаётся одним просмотром главной. Так и глубина
// просмотра, и время на сайте выходят заниженными, а именно по ним оценивают
// медиа рекламодатели.
//
// Поэтому на каждую смену адреса отправляем «hit» вручную. Первый просмотр
// пропускаем: его уже засчитал сам счётчик при инициализации.
declare global {
  interface Window {
    ym?: (id: number, action: string, url?: string, opts?: Record<string, unknown>) => void;
  }
}

export default function MetrikaRouteHits({ id }: { id: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const num = Number(id);
    if (!Number.isFinite(num) || typeof window.ym !== "function") return;
    const qs = params?.toString();
    const url = window.location.origin + pathname + (qs ? `?${qs}` : "");
    window.ym(num, "hit", url, { referer: document.referrer });
  }, [pathname, params, id]);

  return null;
}
