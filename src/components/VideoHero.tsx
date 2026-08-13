import Link from "next/link";
import Cover from "./Cover";
import type { Article } from "@/lib/types";

// Видео-раздел главной: крупный материал слева, список остальных справа —
// раскладка, знакомая читателю по местным изданиям.
//
// На десктопе видео раньше не было видно вовсе: узкая карусель терялась среди
// текстовых блоков. Здесь у раздела своя тёмная подложка, поэтому он читается
// как отдельный экран, а не как ещё одна лента.
//
// Значок воспроизведения нарисован линиями и треугольником из рамки — никаких
// картинок: они бы грузились отдельным файлом и мазали бы на плотных экранах.
export default function VideoHero({ items, title, moreLabel }: { items: Article[]; title: string; moreLabel: string }) {
  if (!items.length) return null;
  const [lead, ...rest] = items;

  const Play = ({ big = false }: { big?: boolean }) => (
    <span className="absolute inset-0 grid place-items-center">
      <span className={`grid place-items-center rounded-full bg-black/55 ring-2 ring-white/80 ${big ? "h-16 w-16" : "h-9 w-9"}`}>
        <span
          className={`ml-0.5 h-0 w-0 border-y-transparent border-l-white ${
            big ? "border-y-[11px] border-l-[18px]" : "border-y-[7px] border-l-[11px]"
          }`}
        />
      </span>
    </span>
  );

  return (
    <section className="overflow-hidden rounded-2xl bg-brand-900 text-white" aria-label={title}>
      <div className="flex items-center gap-3 px-5 pt-4">
        <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight">{title}</h2>
        <Link href="/video" className="ml-auto text-sm font-semibold text-white/70 hover:text-white">
          {moreLabel} →
        </Link>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Главное видео */}
        <Link href={`/n/${lead.slug}`} className="group block">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black/40">
            {lead.cover && (
              <Cover src={lead.cover} alt={lead.title} width={960} height={540} sizes="(max-width: 1024px) 100vw, 620px"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
            )}
            <Play big />
          </div>
          <h3 className="mt-3 font-serif text-xl font-bold leading-snug group-hover:text-white/80">{lead.title}</h3>
        </Link>

        {/* Остальные — списком справа */}
        {rest.length > 0 && (
          <ul className="space-y-3">
            {rest.slice(0, 4).map((a) => (
              <li key={a.id}>
                <Link href={`/n/${a.slug}`} className="group flex gap-3">
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {a.cover && (
                      <Cover src={a.cover} alt="" width={224} height={126} sizes="112px"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    )}
                    <Play />
                  </span>
                  <span className="line-clamp-3 text-sm font-semibold leading-snug text-white/90 group-hover:text-white">
                    {a.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
