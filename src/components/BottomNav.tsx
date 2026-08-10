"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import Icon, { type IconName } from "./Icon";

// Нижняя панель навигации. Пять разделов:
//
//   Главное — сводный экран со всеми форматами, включая компании и авторов
//   Лента   — строгая хронология всех публикаций
//   Цифры   — дата-центр: курсы, биржа, погода. Крупнее остальных
//   Видео   — материалы с видео
//   Меню    — «Моя страница», кабинеты, рубрики, язык, правовые страницы
//
// «Моя страница» живёт внутри «Меню», а не отдельной кнопкой: так в панель
// помещаются пять входов, и туда же переехало всё, что раньше пряталось под
// гамбургером в шапке.
//
// Подписи короткие (tab.*), полные названия уходят в aria-label (tabFull.*):
// «Yangiliklar tasmasi» на кнопке шириной в пятую часть экрана не помещается,
// но для читалки с экрана нужно полное имя.
const ITEMS = [
  { href: "/", short: "tab.main", full: "tabFull.main", icon: "home" },
  { href: "/feed", short: "tab.feed", full: "tabFull.feed", icon: "feed" },
  { href: "/numbers", short: "tab.numbers", full: "tabFull.numbers", icon: "numbers", accent: true },
  { href: "/video", short: "tab.video", full: "tabFull.video", icon: "video" },
  { href: "/menu", short: "tab.menu", full: "tabFull.menu", icon: "menu" },
] as const;

export default function BottomNav() {
  const path = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black/10 bg-[var(--surface)] shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)] md:hidden dark:border-white/15 dark:bg-ink-surface dark:shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("a11y.menu")}
    >
      <div className="grid grid-cols-5 items-stretch">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          // «Цифры» по ТЗ должны выделяться: крупнее подпись и фирменный
          // тёмно-синий, чтобы дата-центр читался как отдельный вход.
          const accent = "accent" in it && it.accent;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-label={t(it.full)}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-center font-bold ${
                accent ? "text-[12px]" : "text-[11px]"
              } ${
                active
                  ? "text-accent"
                  : accent
                    ? "text-brand dark:text-white"
                    : "text-black/70 dark:text-white/70"
              }`}
            >
              {active && <span className="absolute inset-x-2 top-0 h-1 rounded-b bg-accent" />}
              {active && <span className="absolute inset-x-1 inset-y-1.5 -z-10 rounded-xl bg-accent/10" />}
              <Icon name={it.icon as IconName} size={accent ? 24 : 21} />
              <span className="w-full truncate leading-none">{t(it.short)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
