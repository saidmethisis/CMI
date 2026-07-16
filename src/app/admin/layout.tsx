import { moderationQueue } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import { requireAdmin } from "@/lib/guard";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, perms } = await requireAdmin("/admin");
  const { t } = await serverT();
  const pending = (await moderationQueue()).length;
  return (
    <div className="min-h-screen bg-black/[0.03] dark:bg-black/40 md:grid md:grid-cols-[260px_1fr]">
      {/* Cyclops-style light sidebar */}
      <aside className="flex flex-col gap-4 border-b border-black/5 bg-[var(--surface)] p-4 md:min-h-screen md:border-b-0 md:border-r dark:border-white/10 dark:bg-ink-surface">
        {/* profile card */}
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.07] p-2.5 dark:border-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold text-white">{(user.displayName || user.name).charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.displayName || user.name}</div>
            <div className="truncate text-xs text-black/45 dark:text-white/45">{role?.name ?? user.roleSlug}</div>
          </div>
        </div>

        {/* search */}
        <div className="rounded-xl border border-black/[0.07] px-3 py-2 text-sm text-black/40 dark:border-white/10 dark:text-white/40">{t("adm.search")}</div>

        <AdminNav pending={pending} perms={perms} />
      </aside>

      <section className="p-4 md:p-8">{children}</section>
    </div>
  );
}
