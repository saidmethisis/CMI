import { getAds } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import AdsManager from "./AdsManager";

export const metadata = { title: "Admin — Реклама" };
export const dynamic = "force-dynamic";

export default async function AdminAds() {
  const ads = await getAds();
  const { t } = await serverT();
  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">{t("co.ads")}</h1>
      <p className="mb-5 text-sm text-black/50 dark:text-white/50">Слоты (Top Banner, In-Article, Sidebar), баннеры, частота показа, статистика.</p>
      <AdsManager initial={ads} />
    </div>
  );
}
