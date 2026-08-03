"use client";
import { useEffect } from "react";
import Link from "next/link";

// Граница ошибок для страниц сайта.
//
// Без этого файла Next показывает сырое «Application error: a client-side exception
// has occurred» — читатель видит пустую белую страницу и уходит. Теперь падение
// одного блока даёт понятный экран с кнопкой «Попробовать снова», а шапка, меню
// и футер остаются на месте.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // digest — идентификатор ошибки в логах сервера; по нему её можно найти
    console.error("Ошибка страницы:", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="container-content grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-3xl font-bold">Что-то пошло не так</h1>
        <p className="mt-3 text-black/60 dark:text-white/60">
          Страница временно недоступна. Мы уже знаем о проблеме — попробуйте обновить.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="btn-primary">Попробовать снова</button>
          <Link href="/" className="btn-ghost">На главную</Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-black/35 dark:text-white/35">Код ошибки: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
