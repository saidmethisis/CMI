import { serverT } from "@/lib/i18n-server";

export const metadata = { title: "Офлайн" };

export default async function OfflinePage() {
  const { t } = await serverT();
  return (
    <div className="container-content grid min-h-[60vh] place-items-center py-10 text-center">
      <div>
        <div className="mx-auto h-1.5 w-16 rounded-full bg-accent" />
        <h1 className="mt-5 font-serif text-2xl font-bold">{t("offline.title")}</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">{t("offline.desc")}</p>
      </div>
    </div>
  );
}
