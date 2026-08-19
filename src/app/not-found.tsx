import Link from "next/link";
import type { Metadata } from "next";
import { serverT } from "@/lib/i18n-server";

// Заголовок вкладки на несуществующей странице был общий, как у главной:
// в истории браузера и в списке вкладок ошибка выглядела обычной страницей
// издания. Теперь видно, что материал не найден, — и на языке читателя.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverT();
  return { title: t("notfound.title"), robots: { index: false, follow: true } };
}

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
