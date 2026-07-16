// Небольшая честная пометка «демо» для блоков с иллюстративными (не реальными) данными.
// Без иконок — только текст. Работает и в server-, и в client-компонентах (без хуков).
export default function DemoBadge({ title = "Иллюстративные данные, не из реальной статистики" }: { title?: string }) {
  return (
    <span
      title={title}
      className="ml-2 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
    >
      демо
    </span>
  );
}
