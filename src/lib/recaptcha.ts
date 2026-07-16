// Shared reCAPTCHA config. Site key is public (used in the browser widget),
// the secret lives only on the server (verifyRecaptcha in auth.ts).
// Defaults are Google's official TEST keys — swap via env for production.
export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
