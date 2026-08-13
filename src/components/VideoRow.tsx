"use client";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import Cover from "@/components/Cover";

// Fox-Business-style video block: a heading + cards with a play overlay.
export default function VideoRow({ title, items }: { title: React.ReactNode; items: Article[] }) {
  const { lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-4 border-b-2 border-brand pb-1 font-serif text-2xl font-extrabold">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {items.map((a) => (
          <Link key={a.id} href={`/n/${a.slug}`} className="group">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              {a.cover && <Cover src={a.cover} alt={a.title} width={640} height={360} sizes="(max-width: 768px) 60vw, 300px" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 ring-2 ring-white/80">
                  {/* pure-CSS play triangle */}
                  <span className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-white" />
                </span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase text-accent">
              Video <span className="font-normal text-black/60 dark:text-white/65">{new Date(a.createdAt).toLocaleDateString(loc, { day: "numeric", month: "short" })}</span>
            </div>
            <h3 className="mt-0.5 font-serif text-base font-bold leading-snug group-hover:text-accent">{a.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
