import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";
import Analytics from "@/components/Analytics";
import CookieConsent from "@/components/CookieConsent";
import Providers from "@/components/Providers";
import { getLang } from "@/lib/i18n-server";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Asosiy Aktiv — деловое медиа нового поколения",
    template: "%s — Asosiy Aktiv",
  },
  description: SITE_DESC,
  manifest: "/manifest.webmanifest",
  applicationName: "Asosiy Aktiv",
  alternates: { canonical: "/", types: { "application/rss+xml": `${SITE_URL}/feed.xml` } },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Aktiv" },
  openGraph: { type: "website", title: "Asosiy Aktiv", siteName: "Asosiy Aktiv", url: SITE_URL },
  twitter: { card: "summary_large_image", title: "Asosiy Aktiv", description: SITE_DESC },
  // Подтверждение прав в Google Search Console и Яндекс.Вебмастер — вставьте коды в .env
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon.svg` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "ru",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#11294D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const noFlashTheme = `(function(){try{var t=localStorage.getItem('aktiv.theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="preconnect" href="https://cbu.uz" />
        <link rel="alternate" type="application/rss+xml" title="Asosiy Aktiv — RSS" href="/feed.xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        <Providers initialLang={lang}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-white">
            Перейти к содержимому
          </a>
          <Header />
          <main id="main" className="min-h-[60vh] pb-24 md:pb-10">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <PWARegister />
          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
