import Link from "next/link";

export default function CabinetTabs({ tabs, active }: { tabs: { href: string; label: string }[]; active: string }) {
  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-black/10 dark:border-white/10">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            active === t.href
              ? "border-brand text-brand dark:border-white dark:text-white"
              : "border-transparent text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
