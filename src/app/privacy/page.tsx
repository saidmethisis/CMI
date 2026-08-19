import LegalShell from "@/components/LegalShell";
import { LEGAL_REVISED, formatLegalDate } from "@/lib/legal";
import { ORG } from "@/lib/org";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("lg.privacyTitle") };
}

export default async function PrivacyPage() {
  const { t, lang } = await serverT();
  return (
    <LegalShell title={t("lg.privacyTitle")} updated={formatLegalDate(LEGAL_REVISED.privacy, lang)} updatedLabel={t("ui.updatedOn")}>
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {t("lg.privacyDraftA")} <code>NEXT_PUBLIC_ORG_*</code>{t("lg.privacyDraftB")}
        </div>
      )}

      <p>{t("lg.privacyIntroA")} <b>{ORG.name}</b> {t("lg.privacyIntroB")}</p>

      <h2>{t("lg.privacyH1")}</h2>
      <ul>
        <li>{t("lg.privacyOperName")} {ORG.name}</li>
        <li>{t("lg.founderLabel")} {ORG.founder}</li>
        <li>{t("lg.privacyOperAddress")} {ORG.address}</li>
        <li>{t("lg.privacyOperContact")} {ORG.email}, {ORG.phone}</li>
        <li>{t("lg.privacyOperRegistry")} {ORG.pdRegistry}</li>
      </ul>

      <h2>{t("lg.privacyH2")}</h2>
      <ul>
        <li>{t("lg.privacyData1")}</li>
        <li>{t("lg.privacyData2")}</li>
        <li>{t("lg.privacyData3")}</li>
      </ul>

      <h2>{t("lg.privacyH3")}</h2>
      <ul>
        <li>{t("lg.privacyPurpose1")}</li>
        <li>{t("lg.privacyPurpose2")}</li>
        <li>{t("lg.privacyPurpose3")}</li>
        <li>{t("lg.privacyPurpose4")}</li>
      </ul>

      <h2>{t("lg.privacyH4")}</h2>
      <p>{t("lg.privacyLegalBasis")} {ORG.email}.</p>

      <h2>{t("lg.privacyH5")}</h2>
      <p>{t("lg.privacyStorage")}</p>

      <h2>{t("lg.privacyH6")}</h2>
      <p>{t("lg.privacyThirdParty")}</p>
      {/* Счётчик назван прямо: он пишет не только просмотры, но и действия на
          странице. Общей формулировки «используемые сервисы аналитики» для
          такой записи мало. */}
      <p>{t("lg.privacyAnalytics")}</p>

      <h2>{t("lg.privacyH7")}</h2>
      <ul>
        <li>{t("lg.privacyRights1")}</li>
        <li>{t("lg.privacyRights2")}</li>
        <li>{t("lg.privacyRights3")}</li>
      </ul>

      <h2>{t("lg.privacyH8")}</h2>
      <p>{t("lg.privacyCookies")}</p>

      <h2>{t("lg.privacyH9")}</h2>
      <p>{t("lg.privacyContact")} {ORG.email}, {ORG.phone}.</p>
    </LegalShell>
  );
}
