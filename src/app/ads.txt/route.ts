// ads.txt — список авторизованных продавцов рекламы (Google AdSense / Яндекс и т.п.).
// Заполните ADS_TXT в .env, напр. для AdSense:
//   ADS_TXT="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
// Несколько строк разделяйте \n. Без переменной отдаётся пустой валидный файл.
export const dynamic = "force-dynamic";

export function GET() {
  const body = (process.env.ADS_TXT || "# ads.txt — добавьте строки авторизованных продавцов в переменную ADS_TXT").replace(/\\n/g, "\n");
  return new Response(body + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
