import { serverT } from "@/lib/i18n-server";
export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("meta.login") };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
