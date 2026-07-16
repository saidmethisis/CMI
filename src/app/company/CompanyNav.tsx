"use client";
import { useEffect, useState } from "react";

// Навигация кабинета компании с подсветкой активного раздела при скролле (scrollspy).
export default function CompanyNav({ items }: { items: { key: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.key ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis?.target?.id) setActive(vis.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    items.forEach((i) => { const el = document.getElementById(i.key); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [items]);

  const go = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const el = document.getElementById(key);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    setActive(key);
  };

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
      {items.map((s) => (
        <a
          key={s.key}
          href={`#${s.key}`}
          onClick={(e) => go(e, s.key)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${active === s.key ? "bg-accent/10 font-semibold text-accent" : "text-black/65 hover:bg-black/[0.04] dark:text-white/65 dark:hover:bg-white/[0.06]"}`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
