"use client";
import { useEffect } from "react";
import { maskInputFields } from "@/lib/ym-fields";

// Подстраховка к меткам ym-disable-keys, расставленным в разметке: если поле
// появится позже — новая форма, всплывающее окно, чужой виджет — метку ему
// добавит наблюдатель. Иначе содержимое такого поля попало бы в запись
// Вебвизора, а мы в политике конфиденциальности обещали обратное.
//
// Наблюдаем и за списком узлов, и за атрибутом class: React при повторной
// отрисовке перезаписывает className целиком и вместе с ним стёр бы метку.
// Зацикливания нет: свой же класс мы добавляем только тем, у кого его нет,
// поэтому следующий проход не находит ничего и останавливается.
export default function MetrikaFieldGuard() {
  useEffect(() => {
    maskInputFields(document);

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        maskInputFields(document);
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
