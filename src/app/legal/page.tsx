import LegalShell from "@/components/LegalShell";
import { ORG } from "@/lib/org";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("lg.legalTitle") };
}

export default async function ImpressumPage() {
  const { t } = await serverT();
  return (
    <LegalShell title={t("lg.legalTitle")}>
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {t("lg.legalDraftA")} <code>NEXT_PUBLIC_ORG_*</code>{t("lg.legalDraftB")}
        </div>
      )}

      <table className="w-full text-sm">
        <tbody className="[&_td]:border-t [&_td]:border-black/5 [&_td]:py-2.5 dark:[&_td]:border-white/10 [&_td:first-child]:w-1/3 [&_td:first-child]:font-semibold">
          {/* Строку без значения не выводим: таблица из прочерков хуже короткой
              таблицы — читателю кажется, что данные скрыли, а не что их пока нет. */}
          <tr><td>{t("lg.legalPubName")}</td><td>{ORG.name}</td></tr>
          {ORG.founder && <tr><td>{t("lg.legalFounder")}</td><td>{ORG.founder}</td></tr>}
          {ORG.taxId && <tr><td>{t("lg.privacyOperTaxId")}</td><td>{ORG.taxId}</td></tr>}
          {ORG.editor && <tr><td>{t("lg.legalEditor")}</td><td>{ORG.editor}</td></tr>}
          {ORG.address && <tr><td>{t("lg.legalAddress")}</td><td>{ORG.address}</td></tr>}
          {ORG.email && <tr><td>{t("lg.legalEmail")}</td><td>{ORG.email}</td></tr>}
          {ORG.phone && <tr><td>{t("ap.phone")}</td><td>{ORG.phone}</td></tr>}
          {ORG.smiCert && <tr><td>{t("lg.legalSmiCert")}</td><td>{ORG.smiCert}</td></tr>}
          <tr><td>{t("lg.legalAgeCat")}</td><td>{ORG.age}</td></tr>
        </tbody>
      </table>

      <h2>{t("lg.legalInfoTitle")}</h2>
      <ul>
        <li><a href="/privacy">{t("lg.privacyTitle")}</a></li>
        <li><a href="/terms">{t("lg.termsTitle")}</a></li>
      </ul>

      <p className="text-sm text-black/60 dark:text-white/65">{t("lg.legalNote")}</p>
    </LegalShell>
  );
}
