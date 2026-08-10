"use client";
import { useEffect, useId, useRef } from "react";

// Один рекламный блок сети — AdSense или РСЯ.
//
// Какая сеть покажется, решают переменные окружения: если задан блок Яндекса
// для этой зоны, показываем его, иначе AdSense, иначе ничего. Двух сетей в
// одном месте быть не должно — они конкурируют и обе платят меньше.
//
// Место под блок заранее не резервируем высотой в стиле «пустая серая рамка»:
// пока сеть не отдала объявление, контейнер схлопнут и не толкает статью вниз.
// Как только объявление придёт, оно раздвинет место само.

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    yaContextCb?: (() => void)[];
    Ya?: { Context: { AdvManager: { render: (o: { blockId: string; renderTo: string }) => void } } };
  }
}

export default function NetworkAd({ zone, className = "" }: { zone: "leaderboard" | "mpu" | "in-content"; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const holder = `ya-${zone}-${uid}`;
  const done = useRef(false);

  const yaBlock =
    zone === "leaderboard" ? process.env.NEXT_PUBLIC_YANDEX_RTB_TOP
    : zone === "mpu" ? process.env.NEXT_PUBLIC_YANDEX_RTB_SIDE
    : process.env.NEXT_PUBLIC_YANDEX_RTB_INLINE;
  const adsense = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adsenseSlot =
    zone === "leaderboard" ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP
    : zone === "mpu" ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE
    : process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE;

  useEffect(() => {
    // Повторный вызов на том же блоке сети считают ошибкой и перестают
    // отдавать объявления, поэтому выполняем ровно один раз.
    if (done.current) return;
    done.current = true;

    if (yaBlock) {
      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(() => {
        try { window.Ya?.Context.AdvManager.render({ blockId: yaBlock, renderTo: holder }); } catch { /* сеть недоступна */ }
      });
      return;
    }
    if (adsense && adsenseSlot) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* сеть недоступна */ }
    }
  }, [yaBlock, adsense, adsenseSlot, holder]);

  if (yaBlock) return <div id={holder} className={className} />;

  if (adsense && adsenseSlot) {
    return (
      <ins
        className={`adsbygoogle block ${className}`}
        style={{ display: "block" }}
        data-ad-client={adsense}
        data-ad-slot={adsenseSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    );
  }

  return null;
}
