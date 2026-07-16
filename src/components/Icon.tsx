// Icons are intentionally removed from the UI (text-first, clean design).
// This component renders nothing. If the user later supplies an icon asset set,
// reintroduce a registry here and map names -> SVG.

export type IconName =
  | "menu" | "search" | "close" | "theme" | "user" | "bell" | "home" | "topics"
  | "bookmark" | "bookmark-filled" | "listen" | "focus" | "lock" | "play" | "share"
  | "chevron" | "external" | "download" | "upload" | "check" | "reject" | "return"
  | "star" | "ai" | "dashboard" | "shield" | "grid" | "users" | "ads" | "money"
  | "building" | "author" | "link" | "settings" | "history" | "plus" | "image"
  | "arrow-up" | "globe" | "edit" | "trash";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Icon(_props: { name: IconName; size?: number; className?: string }) {
  return null;
}
