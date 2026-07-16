import crypto from "node:crypto";

// RFC 6238 TOTP (совместимо с Google Authenticator / Authy и т.п.). Без внешних зависимостей.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = "", out = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function b32decode(s: string): Buffer {
  const clean = s.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const ch of clean) { const v = B32.indexOf(ch); if (v >= 0) bits += v.toString(2).padStart(5, "0"); }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const key = b32decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

// window=1 → допускаем соседние 30-сек окна (компенсация рассинхрона часов)
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const code = (token ?? "").trim();
  if (!secret || !/^\d{6}$/.test(code)) return false;
  const t = Math.floor(Date.now() / 30000);
  for (let w = -window; w <= window; w++) if (hotp(secret, t + w) === code) return true;
  return false;
}

export function otpauthUrl(secret: string, account: string, issuer = "Asosiy Aktiv"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
