"use client";

// Последний рубеж: ловит ошибки в самом корневом layout, когда error.tsx уже
// не может отрисоваться (у него нет своей обёртки <html>). Поэтому здесь
// разметка задаётся целиком и без зависимостей от провайдеров и словарей —
// они как раз могут быть причиной падения.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "grid", placeItems: "center", minHeight: "100vh", background: "#f6f7f9", color: "#11294D" }}>
        <div style={{ textAlign: "center", padding: 24, maxWidth: 460 }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>Сайт временно недоступен</h1>
          <p style={{ color: "#5b6472", marginTop: 12, lineHeight: 1.5 }}>
            Мы уже занимаемся проблемой. Пожалуйста, попробуйте обновить страницу через минуту.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 20, padding: "10px 20px", borderRadius: 10, border: 0, background: "#11294D", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Обновить
          </button>
          {error.digest && <p style={{ marginTop: 20, fontSize: 12, color: "#98a1ad" }}>Код ошибки: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
