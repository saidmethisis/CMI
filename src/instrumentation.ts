// Runs once on server start (Next 15). Validates critical env in production so
// the app never boots with insecure defaults (dev secret, reCAPTCHA test keys).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const fail: string[] = [];
  const warn: string[] = [];

  // ── Critical: refuse to boot without these ───────────────────────────────
  const secret = process.env.AUTH_SECRET || "";
  if (!secret || secret === "dev-secret-change-me" || secret.length < 24) {
    fail.push("AUTH_SECRET is missing or weak (need a random string ≥ 24 chars). Generate: `openssl rand -hex 32`.");
  }
  if (!process.env.DATABASE_URL) {
    fail.push("DATABASE_URL is not set.");
  }
  if (!process.env.SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
    fail.push("SITE_URL is not set (needed for canonical links, sitemap, email links).");
  }

  // ── Warnings: app runs, but a security/feature control is degraded ────────
  const TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  const TEST_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === TEST_SITE_KEY ||
      process.env.RECAPTCHA_SECRET_KEY === TEST_SECRET_KEY ||
      !process.env.RECAPTCHA_SECRET_KEY) {
    warn.push("reCAPTCHA is using TEST keys — captcha is decorative and does not block bots. Set real keys from https://www.google.com/recaptcha/admin");
  }
  if (!process.env.RESEND_API_KEY) {
    warn.push("RESEND_API_KEY is not set — password-reset / verification emails are only logged, not delivered.");
  }
  if (!process.env.SUPERADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD === "aktiv12345") {
    warn.push("SUPERADMIN_PASSWORD is unset or the default — the auto-created admin account has a publicly-known password. Set SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD before first launch.");
  }

  for (const w of warn) console.warn(`[startup:warn] ${w}`);
  if (fail.length) {
    console.error("\n[startup:FATAL] Refusing to start with an insecure configuration:");
    for (const f of fail) console.error(`  • ${f}`);
    console.error("Fix the environment variables above and restart.\n");
    // Hard-stop: never serve production traffic with dev secrets.
    process.exit(1);
  }
}
