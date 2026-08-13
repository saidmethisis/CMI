"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Строка срочных новостей — непрерывно едет, а не перелистывается рывками.
//
// Раньше заголовки менялись подменой списка раз в 4 секунды: читатель видел
// скачок и мог не успеть дочитать. Теперь это лента, которая плавно движется.
//
// Как устроено бесшовное движение: список печатается ДВАЖДЫ подряд, а дорожка
// сдвигается ровно на половину своей ширины. В момент, когда первая копия
// уезжает, на её месте оказывается вторая — стык не виден, и анимация может
// повторяться бесконечно без прыжка.
//
// Движение останавливается при наведении мыши и при попадании фокуса внутрь:
// иначе по ссылке невозможно попасть, а WCAG 2.2.2 требует, чтобы движение
// дольше пяти секунд можно было остановить. Тем, кто в системе отключил
// анимации, лента показывается неподвижной (см. globals.css).
export default function BreakingNews({ items }: { items: { slug: string; title: string }[] }) {
  const { t } = useI18n();
  if (!items.length) return null;

  // Скорость постоянная: чем больше заголовков, тем дольше круг. Иначе с двумя
  // новостями лента носилась бы, а с десятью ползла.
  const seconds = Math.max(24, items.length * 9);

  const strip = (key: string) =>
    items.map((n) => (
      <Link
        key={`${key}-${n.slug}`}
        href={`/n/${n.slug}`}
        className="shrink-0 font-medium transition-colors hover:text-accent"
      >
        {n.title}
      </Link>
    ));

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.06]">
      <div className="flex shrink-0 items-center gap-2 bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        {t("home.breaking")}
      </div>

      <div className="marquee min-w-0 flex-1 py-2 text-sm">
        <div className="marquee-track gap-8" style={{ animationDuration: `${seconds}s` }}>
          {strip("a")}
          {/* Вторая копия — та самая, за счёт которой стык не виден.
              Для чтения с экрана она лишняя, поэтому скрыта от озвучивания. */}
          <span aria-hidden className="contents">{strip("b")}</span>
        </div>
      </div>
    </div>
  );
}
