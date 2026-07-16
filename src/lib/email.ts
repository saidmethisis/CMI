// Отправка писем. С ключом RESEND_API_KEY шлёт реальные письма через Resend HTTP API
// (без npm-зависимостей). Без ключа — пишет в серверный лог (dev), чтобы поток работал локально.
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Asosiy Aktiv <onboarding@resend.dev>";
  if (!key) {
    if (process.env.NODE_ENV !== "production") console.log(`[email:dev] → ${to} · ${subject}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`);
    return { sent: false };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return { sent: r.ok };
  } catch {
    return { sent: false };
  }
}

const SITE = process.env.SITE_URL || "http://localhost:3000";

export function resetEmail(email: string, token: string) {
  const link = `${SITE}/forgot?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  return {
    subject: "Сброс пароля — Asosiy Aktiv",
    html: `<div style="font-family:sans-serif;max-width:480px">
      <h2>Сброс пароля</h2>
      <p>Вы запросили сброс пароля. Нажмите кнопку ниже (ссылка действует 30 минут):</p>
      <p><a href="${link}" style="display:inline-block;background:#14314f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Сбросить пароль</a></p>
      <p style="color:#888;font-size:12px">Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
    </div>`,
  };
}

export function verifyEmailMessage(email: string, code: string) {
  const link = `${SITE}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(code)}`;
  return {
    subject: "Подтверждение e-mail — Asosiy Aktiv",
    html: `<div style="font-family:sans-serif;max-width:480px">
      <h2>Подтвердите e-mail</h2>
      <p>Код подтверждения: <b style="font-size:18px">${code}</b></p>
      <p>Или нажмите: <a href="${link}">подтвердить e-mail</a></p>
    </div>`,
  };
}
