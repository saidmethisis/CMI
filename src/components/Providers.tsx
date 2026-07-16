"use client";
import { I18nProvider } from "@/lib/i18n";
import { TaxonomyProvider } from "@/lib/taxonomy";
import { AuthProvider } from "@/lib/useAuth";
import type { Lang } from "@/lib/dictionaries";

export default function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  return (
    <I18nProvider initialLang={initialLang}>
      <AuthProvider>
        <TaxonomyProvider>{children}</TaxonomyProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
