import { indexNowKey } from "@/lib/indexnow";

// Файл-подтверждение для IndexNow: поисковик скачивает его и сверяет с ключом
// из запроса — так он убеждается, что уведомление пришло от владельца сайта.
// Ключ не секрет: он лишь доказывает, что у отправителя есть доступ к сайту.
export const dynamic = "force-dynamic";

export function GET() {
  const key = indexNowKey();
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
