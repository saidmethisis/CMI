import LegalShell from "@/components/LegalShell";
import { ORG } from "@/lib/org";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("lg.termsTitle") };
}

export default async function TermsPage() {
  const { t } = await serverT();
  return (
    <LegalShell title={t("lg.termsTitle")} updated="__.__.2026" updatedLabel={t("ui.updatedOn")}>
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {t("lg.termsDraft")}
        </div>
      )}

      <p>{t("lg.termsIntroA")} {ORG.name} {t("lg.termsIntroB")}</p>

      <h2>{t("lg.termsH1")}</h2>
      <p>{t("lg.termsDefA")} {ORG.name}{t("lg.termsDefB")}</p>

      <h2>{t("lg.termsH2")}</h2>
      <ul>
        <li>{t("lg.termsReg1")}</li>
        <li>{t("lg.termsReg2")} <a href="/privacy">{t("lg.privacyPolicyLink")}</a>).</li>
      </ul>

      <h2>{t("lg.termsH3")}</h2>
      <p>{t("lg.termsConduct")}</p>

      <h2>{t("lg.termsH4")}</h2>
      <ul>
        <li>{t("lg.termsUgc1")}</li>
        <li>{t("lg.termsUgc2")}</li>
        <li>{t("lg.termsUgc3")}</li>
      </ul>

      <h2>{t("lg.termsH5")}</h2>
      <p>{t("lg.termsIp")}</p>

      <h2>{t("lg.termsH6")}</h2>
      <p>{t("lg.termsAge")} {ORG.age}.</p>

      <h2>{t("lg.termsH7")}</h2>
      <p>{t("lg.termsLiability")}</p>

      <h2>{t("lg.termsH8")}</h2>
      <p>{ORG.name}. {t("lg.founderLabel")} {ORG.founder}. {t("lg.termsContactsLabel")} {ORG.email}, {ORG.phone}.</p>
    </LegalShell>
  );
}
