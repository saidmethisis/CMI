import crypto from "node:crypto";

// Шифрование секретов в БД (AES-256-GCM). Ключ выводится из AUTH_SECRET.
// Обратная совместимость: нешифрованные старые значения читаются как есть.
const KEY = crypto.createHash("sha256").update(process.env.AUTH_SECRET || "dev-secret-change-me").digest();

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "enc:" + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith("enc:")) return stored; // старое нешифрованное значение
  try {
    const raw = Buffer.from(stored.slice(4), "base64");
    const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), enc = raw.subarray(28);
    const d = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}
