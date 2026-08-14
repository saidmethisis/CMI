// Защита введённого текста от записи Вебвизором.
//
// Вебвизор Яндекс.Метрики пишет сеанс посетителя целиком, включая нажатия
// клавиш. В настройках счётчика запись содержимого полей выключить нельзя —
// переключатель заблокирован; Яндекс предлагает единственный способ: пометить
// поля классом ym-disable-keys, тогда их содержимое уходит в запись
// звёздочками. Пароли Метрика не пишет и без метки, а вот адреса почты,
// телефоны, имена и черновики комментариев — пишет.
//
// Метки проставлены прямо в разметке у всех наших полей. Эта функция —
// подстраховка на случай поля, добавленного позже и без метки: она проходит по
// документу и дописывает класс всему, что принимает ввод.
export const NO_KEYS = "ym-disable-keys";

// Поле, у которого запись содержимого нужна намеренно, помечается вручную —
// его не трогаем.
const KEEP = "ym-record-keys";

const SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"])',
  "textarea",
  '[contenteditable=""]',
  '[contenteditable="true"]',
]
  .map((s) => `${s}:not(.${NO_KEYS}):not(.${KEEP})`)
  .join(",");

type Root = { querySelectorAll: (sel: string) => ArrayLike<{ classList: { add: (c: string) => void } }> };

/** Помечает все непомеченные поля ввода. Возвращает, скольким добавил метку. */
export function maskInputFields(root: Root): number {
  const found = root.querySelectorAll(SELECTOR);
  for (let i = 0; i < found.length; i++) found[i].classList.add(NO_KEYS);
  return found.length;
}
