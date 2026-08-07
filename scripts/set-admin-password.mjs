// Задаёт пароль суперадмина (и создаёт аккаунт, если его ещё нет).
//
// Зачем: обычный сид создаёт админа только на ПУСТОЙ базе, поэтому смена
// SUPERADMIN_PASSWORD в .env уже существующий аккаунт не трогает — и можно
// оказаться запертым снаружи. Этот скрипт решает такую ситуацию.
//
// Запуск:
//   npm run admin:password                    — взять email/пароль из .env
//   npm run admin:password -- a@b.uz secret   — задать явно
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// тот же формат, что и в src/lib/auth.ts: scrypt, "соль:хеш"
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}

const [argEmail, argPassword] = process.argv.slice(2);
const email = (argEmail || process.env.SUPERADMIN_EMAIL || "super@aktiv.uz").trim().toLowerCase();
const password = argPassword || process.env.SUPERADMIN_PASSWORD || "";

if (!password) {
  console.error("Пароль не задан. Укажите SUPERADMIN_PASSWORD в .env или передайте аргументом:\n  npm run admin:password -- admin@site.uz mypassword");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Пароль слишком короткий — минимум 8 символов.");
  process.exit(1);
}

const existing = await prisma.appUser.findUnique({ where: { email } });
if (existing) {
  await prisma.appUser.update({
    where: { email },
    // заодно снимаем блокировку и 2FA — иначе сброс пароля не вернёт доступ
    data: { passwordHash: hashPassword(password), status: "active", twoFactor: false, twoFactorSecret: "" },
  });
  console.log(`Пароль обновлён: ${email} (роль ${existing.roleSlug}, статус active, 2FA выключена)`);
} else {
  await prisma.appUser.create({
    data: {
      id: "u-" + Date.now().toString(36),
      name: "Суперадмин", displayName: "Суперадмин",
      email, passwordHash: hashPassword(password),
      roleSlug: "superadmin", status: "active", emailVerified: true,
    },
  });
  console.log(`Создан суперадмин: ${email}`);
}
await prisma.$disconnect();
