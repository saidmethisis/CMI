// Значки интерфейса.
//
// Рисуются кодом — это контуры SVG, а не картинки: их не нужно загружать
// отдельным файлом, они наследуют цвет текста и остаются чёткими на любом
// экране. Свои изображения сюда подставлять нельзя, только линии.
//
// Набор намеренно маленький: заведён ровно под нижнюю панель навигации, где
// без значков кнопки читаются хуже. Всё остальное в интерфейсе остаётся
// текстовым — так задумано с самого начала. Незнакомое имя не рисует ничего,
// поэтому старые вызовы Icon по всему коду продолжают работать молча.

export type IconName =
  | "menu" | "search" | "close" | "theme" | "user" | "bell" | "home" | "topics"
  | "bookmark" | "bookmark-filled" | "listen" | "focus" | "lock" | "play" | "share"
  | "chevron" | "external" | "download" | "upload" | "check" | "reject" | "return"
  | "star" | "ai" | "dashboard" | "shield" | "grid" | "users" | "ads" | "money"
  | "building" | "author" | "link" | "settings" | "history" | "plus" | "image"
  | "arrow-up" | "globe" | "edit" | "trash"
  | "feed" | "numbers" | "video";

// Контуры в системе координат 24×24. Только линии, заливки нет: значок
// подстраивается под цвет текста и одинаково выглядит в светлой и тёмной теме.
const PATHS: Partial<Record<IconName, React.ReactNode>> = {
  home: <path d="M3 10.2 12 3.5l9 6.7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  feed: (
    <>
      <path d="M4 6h10M4 12h16M4 18h12" />
      <circle cx="18.5" cy="6" r="1.5" />
    </>
  ),
  numbers: (
    <>
      <path d="M4 20V10M9.5 20V4M15 20v-7M20.5 20v-4" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10.5 21 8v8l-5-2.5z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export default function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const shape = PATHS[name];
  if (!shape) return null;
  return (
    <svg
      aria-hidden
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {shape}
    </svg>
  );
}
