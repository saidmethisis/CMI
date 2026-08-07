import { notFound } from "next/navigation";
import { articleForModeration } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import ModeratorEditor, { type ModerationArticle } from "./ModeratorEditor";

// Страница проверки одного материала. Права проверяет layout админки;
// здесь только загрузка данных.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("adm.modTitle") };
}

export default async function ModerationItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await articleForModeration(id);
  if (!a) notFound();
  return <ModeratorEditor article={a as ModerationArticle} />;
}
