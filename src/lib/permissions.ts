// ── RBAC catalog (Stage 16) ───────────────────────────────────────────────────
// Granular permissions down to the action level, grouped by module.

export interface PermAction { key: string; label: string }
export interface PermModule { key: string; label: string; actions: PermAction[] }

export const PERMISSION_MODULES: PermModule[] = [
  {
    key: "news", label: "Новости / Статьи",
    actions: [
      { key: "view", label: "Просмотр" },
      { key: "create", label: "Создание" },
      { key: "edit_own", label: "Редактирование своих" },
      { key: "edit_all", label: "Редактирование всех" },
      { key: "publish", label: "Публикация" },
      { key: "unpublish", label: "Снятие с публикации" },
      { key: "archive", label: "Архивирование" },
      { key: "delete", label: "Удаление" },
      { key: "bulk_delete", label: "Массовое удаление" },
      { key: "schedule", label: "Планирование публикаций" },
      { key: "pin", label: "Закрепление новости" },
      { key: "breaking", label: "Срочная новость" },
    ],
  },
  { key: "media", label: "Медиа", actions: [
    { key: "view", label: "Просмотр" }, { key: "upload", label: "Загрузка" }, { key: "edit", label: "Редактирование" }, { key: "delete", label: "Удаление" },
  ]},
  { key: "comments", label: "Комментарии", actions: [
    { key: "view", label: "Просмотр" }, { key: "moderate", label: "Модерация" }, { key: "reply", label: "Ответы" }, { key: "report", label: "Жалоба" }, { key: "delete", label: "Удаление" }, { key: "ban", label: "Бан автора" },
  ]},
  { key: "categories", label: "Категории и Stories", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Редактирование" }, { key: "delete", label: "Удаление" },
  ]},
  { key: "companies", label: "Компании", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Редактирование" }, { key: "delete", label: "Удаление" }, { key: "assign_owner", label: "Назначение владельца" }, { key: "set_permissions", label: "Настройка прав" },
  ]},
  { key: "authors", label: "Авторы", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Редактирование" }, { key: "delete", label: "Удаление" }, { key: "set_permissions", label: "Настройка прав" },
  ]},
  { key: "users", label: "Пользователи", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Редактирование" }, { key: "block", label: "Блокировка" }, { key: "disable", label: "Отключение" }, { key: "login_as", label: "Вход в аккаунт (Login as)" }, { key: "assign_role", label: "Назначение роли" },
  ]},
  { key: "roles", label: "Роли и права", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Изменение" }, { key: "delete", label: "Удаление" }, { key: "assign_permissions", label: "Назначение прав" },
  ]},
  { key: "ads", label: "Реклама", actions: [
    { key: "view", label: "Просмотр" }, { key: "create", label: "Создание" }, { key: "edit", label: "Редактирование" }, { key: "delete", label: "Удаление" }, { key: "stats", label: "Статистика" },
  ]},
  { key: "seo", label: "SEO", actions: [{ key: "view", label: "Просмотр" }, { key: "edit", label: "Редактирование" }]},
  { key: "analytics", label: "Аналитика", actions: [{ key: "view", label: "Просмотр" }]},
  { key: "billing", label: "Биллинг", actions: [{ key: "view", label: "Просмотр" }, { key: "manage", label: "Управление" }]},
  { key: "settings", label: "Настройки сайта", actions: [{ key: "view", label: "Просмотр" }, { key: "manage", label: "Управление" }]},
  { key: "audit", label: "Журнал действий", actions: [{ key: "view", label: "Просмотр" }]},
];

export const ALL_PERMISSIONS: string[] = PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => `${m.key}.${a.key}`));

const P = (mod: string, ...acts: string[]) => acts.map((a) => `${mod}.${a}`);

export interface RoleDef { slug: string; name: string; description: string; system: boolean; permissions: string[] }

// Simplified role model: only 4 roles.
export const DEFAULT_ROLES: RoleDef[] = [
  { slug: "superadmin", name: "Super Admin", description: "Полный доступ ко всей платформе", system: true, permissions: ["*"] },
  { slug: "reader", name: "Reader (Читатель)", description: "Чтение и взаимодействие", system: true,
    permissions: [...P("news", "view"), ...P("comments", "view", "reply", "report")] },
  { slug: "writer", name: "Writer (Писатель)", description: "Создание и ведение собственных материалов", system: true,
    permissions: [...P("news", "view", "create", "edit_own"), ...P("media", "view", "upload"), ...P("comments", "view", "reply")] },
  { slug: "company", name: "Company (Компания)", description: "Публикации и реклама от имени компании", system: true,
    permissions: [...P("news", "view", "create", "edit_own"), ...P("media", "view", "upload"), ...P("ads", "view"), ...P("comments", "view", "reply")] },
];

export function can(permissions: string[] | undefined, perm: string): boolean {
  if (!permissions) return false;
  return permissions.includes("*") || permissions.includes(perm);
}

// Only Super Admin may enter the admin area.
export function canAccessAdmin(permissions: string[] | undefined): boolean {
  return !!permissions && permissions.includes("*");
}

// ── Company capabilities (Stage 20) — individual on/off toggles ────────────────
export const COMPANY_CAPABILITIES: PermAction[] = [
  { key: "publish_news", label: "Публиковать новости" },
  { key: "publish_press", label: "Публиковать пресс-релизы" },
  { key: "create_authors", label: "Создавать авторов" },
  { key: "edit_own_only", label: "Редактировать только свои материалы" },
  { key: "delete_publications", label: "Удалять публикации" },
  { key: "moderate_comments", label: "Модерировать комментарии" },
  { key: "place_ads", label: "Размещать рекламу" },
  { key: "publish_jobs", label: "Публиковать вакансии" },
  { key: "publish_events", label: "Публиковать мероприятия" },
  { key: "create_staff", label: "Создавать сотрудников" },
  { key: "use_analytics", label: "Использовать аналитику" },
  { key: "use_seo", label: "Работать с SEO" },
];

// ── Company cabinet sections (Stage 18) — super-admin enables per company ──────
export const COMPANY_SECTIONS: PermAction[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "news", label: "Новости компании" },
  { key: "press", label: "Пресс-релизы" },
  { key: "media", label: "Медиа" },
  { key: "gallery", label: "Галерея" },
  { key: "video", label: "Видео" },
  { key: "documents", label: "Документы" },
  { key: "staff", label: "Сотрудники" },
  { key: "authors", label: "Авторы компании" },
  { key: "statistics", label: "Статистика" },
  { key: "analytics", label: "Аналитика" },
  { key: "ads", label: "Рекламный кабинет" },
  { key: "settings", label: "Настройки" },
  { key: "seo", label: "SEO" },
  { key: "comments", label: "Комментарии" },
  { key: "requests", label: "Заявки" },
];

// ── Author capabilities (Stage 20) ────────────────────────────────────────────
export const AUTHOR_CAPABILITIES: PermAction[] = [
  { key: "write", label: "Писать статьи" },
  { key: "edit_own", label: "Редактировать свои статьи" },
  { key: "upload_photos", label: "Загружать фотографии" },
  { key: "use_ai", label: "Использовать AI-помощника" },
  { key: "publish_self", label: "Публиковать самостоятельно" },
  { key: "edit_seo", label: "Изменять SEO" },
  { key: "reply_comments", label: "Отвечать на комментарии" },
];
