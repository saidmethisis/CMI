import { getAccreditation } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import AccreditationList from "./AccreditationList";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("meta.adminAccreditation") };
}
export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const accreditation = await getAccreditation();
  const { t } = await serverT();
  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">{t("a.hAccred")}</h1>
      <p className="mb-5 text-sm text-black/60 dark:text-white/65">{t("misc.accredDesc")}</p>
      <AccreditationList initial={accreditation} />
    </div>
  );
}
