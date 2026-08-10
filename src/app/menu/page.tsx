import { serverT } from "@/lib/i18n-server";
import MenuScreen from "./MenuScreen";

// Раздел «Меню» — пятая кнопка нижней панели.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("tabFull.menu") };
}

export default function MenuPage() {
  return <MenuScreen />;
}
