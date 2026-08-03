// ── RBAC catalog (Stage 16) ───────────────────────────────────────────────────
// Granular permissions down to the action level, grouped by module.
//
// NOTE: `label` fields hold i18n KEYS (not literal text) — this module is plain
// data and cannot call a hook. Consumers must render them through `t(label)`.
// `key`/`slug` values are identifiers and must never be translated.

export interface PermAction { key: string; label: string }
export interface PermModule { key: string; label: string; actions: PermAction[] }

export const PERMISSION_MODULES: PermModule[] = [
  {
    key: "news", label: "perm.mod.news",
    actions: [
      { key: "view", label: "perm.act.view" },
      { key: "create", label: "perm.act.create" },
      { key: "edit_own", label: "perm.act.editOwn" },
      { key: "edit_all", label: "perm.act.editAll" },
      { key: "publish", label: "perm.act.publish" },
      { key: "unpublish", label: "perm.act.unpublish" },
      { key: "archive", label: "perm.act.archive" },
      { key: "delete", label: "perm.act.delete" },
      { key: "bulk_delete", label: "perm.act.bulkDelete" },
      { key: "schedule", label: "perm.act.schedule" },
      { key: "pin", label: "perm.act.pin" },
      { key: "breaking", label: "perm.act.breaking" },
    ],
  },
  { key: "media", label: "perm.mod.media", actions: [
    { key: "view", label: "perm.act.view" }, { key: "upload", label: "perm.act.upload" }, { key: "edit", label: "perm.act.edit" }, { key: "delete", label: "perm.act.delete" },
  ]},
  { key: "comments", label: "perm.mod.comments", actions: [
    { key: "view", label: "perm.act.view" }, { key: "moderate", label: "perm.act.moderate" }, { key: "reply", label: "perm.act.reply" }, { key: "report", label: "perm.act.report" }, { key: "delete", label: "perm.act.delete" }, { key: "ban", label: "perm.act.ban" },
  ]},
  { key: "categories", label: "perm.mod.categories", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.edit" }, { key: "delete", label: "perm.act.delete" },
  ]},
  { key: "companies", label: "perm.mod.companies", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.edit" }, { key: "delete", label: "perm.act.delete" }, { key: "assign_owner", label: "perm.act.assignOwner" }, { key: "set_permissions", label: "perm.act.setPermissions" },
  ]},
  { key: "authors", label: "perm.mod.authors", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.edit" }, { key: "delete", label: "perm.act.delete" }, { key: "set_permissions", label: "perm.act.setPermissions" },
  ]},
  { key: "users", label: "perm.mod.users", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.edit" }, { key: "block", label: "perm.act.block" }, { key: "disable", label: "perm.act.disable" }, { key: "login_as", label: "perm.act.loginAs" }, { key: "assign_role", label: "perm.act.assignRole" },
  ]},
  { key: "roles", label: "perm.mod.roles", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.change" }, { key: "delete", label: "perm.act.delete" }, { key: "assign_permissions", label: "perm.act.assignPermissions" },
  ]},
  { key: "ads", label: "perm.mod.ads", actions: [
    { key: "view", label: "perm.act.view" }, { key: "create", label: "perm.act.create" }, { key: "edit", label: "perm.act.edit" }, { key: "delete", label: "perm.act.delete" }, { key: "stats", label: "perm.act.stats" },
  ]},
  { key: "seo", label: "perm.mod.seo", actions: [{ key: "view", label: "perm.act.view" }, { key: "edit", label: "perm.act.edit" }]},
  { key: "analytics", label: "perm.mod.analytics", actions: [{ key: "view", label: "perm.act.view" }]},
  { key: "billing", label: "perm.mod.billing", actions: [{ key: "view", label: "perm.act.view" }, { key: "manage", label: "perm.act.manage" }]},
  { key: "settings", label: "perm.mod.settings", actions: [{ key: "view", label: "perm.act.view" }, { key: "manage", label: "perm.act.manage" }]},
  { key: "audit", label: "perm.mod.audit", actions: [{ key: "view", label: "perm.act.view" }]},
];

export const ALL_PERMISSIONS: string[] = PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => `${m.key}.${a.key}`));

const P = (mod: string, ...acts: string[]) => acts.map((a) => `${mod}.${a}`);

export interface RoleDef { slug: string; name: string; description: string; system: boolean; permissions: string[] }

// Simplified role model: only 4 roles.
// IMPORTANT: `name`/`description` here are SEEDED INTO THE DATABASE by
// `ensureRbacSeed()` (src/lib/rbac-store.ts) and are read back from the DB by the
// admin roles page. They are DB values, not UI literals — do NOT turn them into
// i18n keys, or raw keys end up persisted in the `Role` table.
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
  { key: "publish_news", label: "perm.cap.publishNews" },
  { key: "publish_press", label: "perm.cap.publishPress" },
  { key: "create_authors", label: "perm.cap.createAuthors" },
  { key: "edit_own_only", label: "perm.cap.editOwnOnly" },
  { key: "delete_publications", label: "perm.cap.deletePublications" },
  { key: "moderate_comments", label: "perm.cap.moderateComments" },
  { key: "place_ads", label: "perm.cap.placeAds" },
  { key: "publish_jobs", label: "perm.cap.publishJobs" },
  { key: "publish_events", label: "perm.cap.publishEvents" },
  { key: "create_staff", label: "perm.cap.createStaff" },
  { key: "use_analytics", label: "perm.cap.useAnalytics" },
  { key: "use_seo", label: "perm.cap.useSeo" },
];

// ── Company cabinet sections (Stage 18) — super-admin enables per company ──────
// Labels reuse the existing `co.*` cabinet-navigation keys.
export const COMPANY_SECTIONS: PermAction[] = [
  { key: "dashboard", label: "co.dashboard" },
  { key: "news", label: "co.news" },
  { key: "press", label: "co.press" },
  { key: "media", label: "co.media" },
  { key: "gallery", label: "co.gallery" },
  { key: "video", label: "co.video" },
  { key: "documents", label: "co.documents" },
  { key: "staff", label: "co.staff" },
  { key: "authors", label: "co.authors" },
  { key: "statistics", label: "co.statistics" },
  { key: "analytics", label: "co.analytics" },
  { key: "ads", label: "co.ads" },
  { key: "settings", label: "co.settings" },
  { key: "seo", label: "co.seo" },
  { key: "comments", label: "co.comments" },
  { key: "requests", label: "co.requests" },
];

// ── Author capabilities (Stage 20) ────────────────────────────────────────────
export const AUTHOR_CAPABILITIES: PermAction[] = [
  { key: "write", label: "perm.acap.write" },
  { key: "edit_own", label: "perm.acap.editOwn" },
  { key: "upload_photos", label: "perm.acap.uploadPhotos" },
  { key: "use_ai", label: "perm.acap.useAi" },
  { key: "publish_self", label: "perm.acap.publishSelf" },
  { key: "edit_seo", label: "perm.acap.editSeo" },
  { key: "reply_comments", label: "perm.acap.replyComments" },
];
