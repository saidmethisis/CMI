import Link from "next/link";
import { serverT } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await serverT();
  return (
    <div className="container-content grid min-h-[60vh] place-items-center py-10 text-center">
      <div>
        <div className="font-serif text-7xl font-bold text-brand">404</div>
        <h1 className="mt-3 text-xl font-semibold">{t("notfound.title")}</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">{t("notfound.desc")}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/" className="btn-primary">{t("notfound.home")}</Link>
          <Link href="/search" className="btn-ghost">{t("nav.search")}</Link>
        </div>
      </div>
    </div>
  );
}
