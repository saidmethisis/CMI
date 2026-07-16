"use client";
import { useI18n } from "@/lib/i18n";

// Tiny helper so server components can render a translated string:  <T k="home.feed" />
export default function T({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
