"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Role = { slug: string; name: string; description: string; system: boolean; permissions: string[] };

// Plain-language summary of what each of the 4 system roles can do.
const ACCESS: Record<string, string[]> = {
  superadmin: ["Полный доступ ко всей платформе", "Админ-панель: контент, пользователи, компании", "Управление ролями, рекламой и настройками"],
  writer: ["Создаёт и редактирует свои статьи", "Загружает медиа и добавляет сторис", "Отвечает на комментарии", "Личный кабинет автора"],
  company: ["Публикации и реклама от имени компании", "Добавляет сторис от компании", "Кабинет: пресс-релизы, аналитика, заявки", "Модерация комментариев к своим материалам"],
  reader: ["Чтение статей и лент", "Комментарии и реакции", "Избранное и личный кабинет"],
};
const TONE: Record<string, string> = {
  superadmin: "from-brand/15 to-brand/5 border-brand/20",
  writer: "from-accent/15 to-accent/5 border-accent/20",
  company: "from-up/15 to-up/5 border-up/20",
  reader: "from-black/[0.06] to-transparent border-black/10 dark:from-white/[0.08] dark:border-white/10",
};

export default function RolesPage() {
  const { t } = useI18n();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/roles", { cache: "no-store" });
      const j = await r.json();
      setRoles(j.data || []);
    })();
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-2xl font-bold">{t("a.hRoles")}</h1>
        <p className="text-sm text-black/50 dark:text-white/50">На платформе 4 готовые роли. Доступ у каждой настроен заранее — выбирать права вручную не нужно.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <div key={r.slug} className={`rounded-2xl border bg-gradient-to-br p-5 ${TONE[r.slug] ?? "border-black/10 from-transparent to-transparent dark:border-white/10"}`}>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold">{r.name}</h2>
              {r.system && <span className="chip !py-0 text-[10px]">системная</span>}
            </div>
            <p className="mb-3 text-sm text-black/55 dark:text-white/55">{r.description}</p>
            <ul className="space-y-1.5 text-sm">
              {(ACCESS[r.slug] ?? [r.permissions.includes("*") ? "Все права" : `${r.permissions.length} прав`]).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-black/40 dark:text-white/40">
        Роль пользователя меняется в разделе «Пользователи». Тонкая настройка отдельных прав отключена — платформа работает на 4 фиксированных ролях.
      </p>
    </div>
  );
}
