"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n";

// each item requires a permission; superadmin ("*") sees all
const nav: { href: string; key: string; perm?: string }[] = [
  { href: "/admin", key: "anav.dashboard" },
  { href: "/admin/moderation", key: "anav.moderation", perm: "news.publish" },
  { href: "/admin/categories", key: "anav.categories", perm: "categories.create" },
  { href: "/admin/roles", key: "anav.roles", perm: "roles.view" },
  { href: "/admin/companies", key: "anav.companies", perm: "companies.view" },
  { href: "/admin/authors", key: "anav.authors", perm: "authors.view" },
  { href: "/admin/staff", key: "anav.users", perm: "users.view" },
  { href: "/admin/users", key: "anav.accreditation", perm: "users.view" },
  { href: "/admin/ads", key: "anav.ads", perm: "ads.view" },
  { href: "/admin/finance", key: "anav.finance", perm: "billing.view" },
];

export default function AdminNav({ pending, perms }: { pending: number; perms: string[] }) {
  const path = usePathname();
  const { t } = useI18n();
  const items = nav.filter((n) => !n.perm || can(perms, n.perm));
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
      {items.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${active ? "bg-accent/10 font-semibold text-accent" : "text-black/70 hover:bg-black/[0.04] dark:text-white/70 dark:hover:bg-white/[0.06]"}`}>
            {active && <span className="absolute inset-y-1.5 left-0 hidden w-1 rounded-r bg-accent md:block" />}
            {t(n.key)}
            {n.href === "/admin/moderation" && pending > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
