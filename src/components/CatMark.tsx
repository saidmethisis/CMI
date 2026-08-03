import type { Category } from "@/lib/types";

// Colored initial mark used in place of a category emoji (no emoji per project rule).
// `label` — уже локализованное название рубрики: без него инициал всегда брался из
// русского name, и на английской версии рядом с «Technology» стояла кириллическая «Т».
export default function CatMark({ cat, label, size = 20, className = "" }: { cat?: Pick<Category, "name" | "color">; label?: string; size?: number; className?: string }) {
  if (!cat) return null;
  return (
    <span
      aria-hidden
      className={`inline-grid place-items-center rounded-md font-bold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: cat.color, fontSize: size * 0.5 }}
    >
      {(label || cat.name).charAt(0).toUpperCase()}
    </span>
  );
}
