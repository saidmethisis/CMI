/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// Единый ответ об ошибке API: { error: { code, message } }.
export function apiError(message: string, status = 400, code = "ERROR") {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Оборачивает обработчик роута: любая необработанная ошибка → аккуратный JSON
// { error: { code, message } } вместо 500 со стек-трейсом. Известные ошибки Prisma
// (нет записи / дубликат) отдаются как 404/409. Дженерик сохраняет исходную сигнатуру
// обработчика, чтобы Next корректно проверял типы роутов (в т.ч. динамических).
export function withHandler<T extends (req: Request, ctx: any) => Promise<Response> | Response>(fn: T): T {
  return (async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "P2025") return apiError("Запись не найдена.", 404, "NOT_FOUND");
      if (err?.code === "P2002") return apiError("Такая запись уже существует.", 409, "CONFLICT");
      console.error("[api]", req.method, (() => { try { return new URL(req.url).pathname; } catch { return ""; } })(), err?.message);
      return apiError("Внутренняя ошибка сервера.", 500, "SERVER_ERROR");
    }
  }) as T;
}

// Безопасный разбор тела запроса: на битом/пустом JSON НЕ бросает исключение
// (иначе был бы необработанный 500 со стеком), а возвращает {} — и тогда
// обычная проверка обязательных полей отдаёт корректный 422.
// Тип по умолчанию — any (как у req.json()), чтобы не ломать существующие роуты.
export async function readBody<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
