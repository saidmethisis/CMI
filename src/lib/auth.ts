import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "aktiv_session";
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

// ── password hashing (scrypt) ─────────────────────────────────────────────────
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, h] = stored.split(":");
  const hh = crypto.scryptSync(pw, salt, 64).toString("hex");
  const a = Buffer.from(h, "hex");
  const b = Buffer.from(hh, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

// strip secrets before sending a user to the client
export function safeUser<T extends Record<string, unknown>>(u: T) {
  const { passwordHash, twoFactorSecret, verifyToken, resetToken, ...rest } = u as Record<string, unknown>;
  void passwordHash; void twoFactorSecret; void verifyToken; void resetToken;
  return rest;
}

// ── sessions ──────────────────────────────────────────────────────────────────
export async function createSession(userId: string) {
  const token = randomToken();
  const h = await headers();
  await prisma.session.create({
    data: { id: "sess-" + randomToken(6), userId, token, userAgent: h.get("user-agent") ?? "", ip: h.get("x-forwarded-for") ?? "local" },
  });
  return token;
}

const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 дней, как maxAge cookie

export async function currentUser() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return null;
  // серверное протухание: даже если cookie цела, старую сессию не принимаем
  if (Date.now() - session.createdAt.getTime() > SESSION_TTL) {
    prisma.session.deleteMany({ where: { token } }).catch(() => {});
    return null;
  }
  const user = await prisma.appUser.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "active") return null;
  prisma.session.update({ where: { token }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return user;
}

export async function currentToken() {
  const c = await cookies();
  return c.get(SESSION_COOKIE)?.value ?? null;
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({ where: { userId }, orderBy: { lastSeenAt: "desc" } });
}
export async function destroySession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
export async function destroyOtherSessions(userId: string, keepToken: string) {
  await prisma.session.deleteMany({ where: { userId, NOT: { token: keepToken } } });
}

// ── login rate-limiting (in-memory) ───────────────────────────────────────────
type Attempt = { count: number; until: number };
const g = globalThis as unknown as { __authAttempts?: Map<string, Attempt> };
const attempts = g.__authAttempts ?? (g.__authAttempts = new Map());
const MAX = 5, WINDOW = 15 * 60 * 1000;
export function loginBlocked(key: string): boolean {
  const a = attempts.get(key);
  return !!a && a.count >= MAX && Date.now() < a.until;
}
export function recordFail(key: string) {
  const a = attempts.get(key) ?? { count: 0, until: 0 };
  a.count += 1; a.until = Date.now() + WINDOW;
  attempts.set(key, a);
  return MAX - a.count;
}
export function resetFails(key: string) { attempts.delete(key); }

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

// Verify a Google reCAPTCHA v2 response token server-side.
export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
    });
    const j = (await r.json()) as { success?: boolean };
    return !!j.success;
  } catch {
    return false;
  }
}

// Короткоживущий подписанный «челлендж» между шагом 1 (пароль+капча) и шагом 2 (2FA-код),
// чтобы на вводе кода не требовать одноразовую reCAPTCHA заново.
export function make2faChallenge(email: string): string {
  const exp = Date.now() + 5 * 60 * 1000;
  const sig = crypto.createHmac("sha256", SECRET).update(`2fa:${email}:${exp}`).digest("hex").slice(0, 32);
  return `${exp}.${sig}`;
}
export function verify2faChallenge(email: string, token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = crypto.createHmac("sha256", SECRET).update(`2fa:${email}:${exp}`).digest("hex").slice(0, 32);
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}
