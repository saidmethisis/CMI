import { Suspense } from "react";
import Script from "next/script";
import MetrikaRouteHits from "./MetrikaRouteHits";
import MetrikaFieldGuard from "./MetrikaFieldGuard";

// Аналитика/теги — подключаются, только если задан соответствующий env-ID.
// Google Analytics 4, Google Tag Manager, Яндекс.Метрика. Без ID ничего не грузится.
export default function Analytics() {
  const GA = process.env.NEXT_PUBLIC_GA_ID;        // G-XXXXXXX
  const GTM = process.env.NEXT_PUBLIC_GTM_ID;      // GTM-XXXXXX
  const YM = process.env.NEXT_PUBLIC_YM_ID;        // 12345678 (Яндекс.Метрика)

  return (
    <>
      {GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');`}
          </Script>
        </>
      )}

      {GTM && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');`}
        </Script>
      )}

      {YM && (
        <>
          {/* ssr:true — страницы приходят готовыми с сервера, и Метрике надо
              об этом сказать, иначе она считает время загрузки неверно. */}
          <Script id="ym" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM}','ym');ym(${YM},'init',{ssr:true,clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
          </Script>
          {/* Переходы внутри сайта Метрика сама не считает — см. компонент. */}
          <Suspense fallback={null}>
            <MetrikaRouteHits id={YM} />
          </Suspense>
          {/* Вебвизор пишет нажатия клавиш; поля с вводом закрываем от записи. */}
          <MetrikaFieldGuard />
          <noscript>
            <div><img src={`https://mc.yandex.ru/watch/${YM}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
          </noscript>
        </>
      )}
    </>
  );
}
