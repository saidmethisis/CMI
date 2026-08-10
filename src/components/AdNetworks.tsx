import Script from "next/script";

// Подключение рекламных сетей: Google AdSense и Рекламная сеть Яндекса (РСЯ).
//
// Обе сети включаются переменными окружения и по умолчанию выключены. Это
// принципиально: чужой скрипт в <head> — самая тяжёлая вещь на странице, и
// висеть там «на всякий случай» он не должен. Нет идентификатора — нет и
// запроса к сети, страница остаётся такой же лёгкой, как была.
//
// Обе загружаются стратегией afterInteractive: реклама не должна задерживать
// первую отрисовку и разметку статьи. Для поисковиков и ИИ это тоже важно —
// они смотрят на скорость.
//
// Что нужно от владельца сайта:
//   AdSense — аккаунт, подтверждение прав на домен, идентификатор вида
//             ca-pub-0000000000000000, плюс строка в ads.txt (переменная ADS_TXT).
//   РСЯ     — площадка в кабинете Яндекса и номера блоков (blockId вида R-A-…).
//
// Пока сайт не прошёл модерацию в сети, блоки будут пустыми — это нормально
// и означает, что код на месте, а разрешения ещё нет.
export default function AdNetworks() {
  const adsense = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const yandex = process.env.NEXT_PUBLIC_YANDEX_RTB_ENABLED === "1";

  return (
    <>
      {adsense && (
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
        />
      )}

      {yandex && (
        <>
          {/* Очередь команд создаётся до загрузки самого скрипта: блоки на
              странице кладут в неё вызовы и не зависят от порядка загрузки. */}
          <Script id="yandex-rtb-queue" strategy="afterInteractive">
            {`window.yaContextCb = window.yaContextCb || [];`}
          </Script>
          <Script id="yandex-rtb" async strategy="afterInteractive" src="https://yandex.ru/ads/system/context.js" />
        </>
      )}
    </>
  );
}
