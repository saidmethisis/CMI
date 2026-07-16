// Mock "AI PR generator" — stands in for OpenAI GPT-4o per TZ §4.2 / AI Engine.
// Deterministic template so the demo works offline with no API key.
// Swap `generatePR` for a real `openai.chat.completions.create(...)` call in prod.

export type PRKind = "launch" | "success" | "analytics" | "promo";

export interface PRInput {
  kind: PRKind;
  company: string;
  facts: string; // пользователь вводит только факты, без воды
  product?: string;
  audience?: string;
}

const intros: Record<PRKind, string> = {
  launch: "Запуск продукта",
  success: "История успеха",
  analytics: "Аналитический материал",
  promo: "Специальное предложение",
};

export function generatePR(input: PRInput): { title: string; lead: string; body: string } {
  const label = intros[input.kind];
  const subject = input.product || input.company;
  const title =
    input.kind === "launch"
      ? `${input.company} представляет ${subject}`
      : input.kind === "success"
        ? `Как ${input.company} добилась результата: разбор кейса`
        : input.kind === "analytics"
          ? `${input.company}: аналитика рынка и ключевые тренды`
          : `${input.company} запускает акцию для клиентов`;

  const lead = `${label}. ${input.facts.split(/[.\n]/)[0]?.trim() || "Компания делится важной новостью с рынком."}`;

  const factLines = input.facts
    .split(/\n|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const body = [
    `${input.company} объявляет о значимом событии, которое отражает стратегию компании и укрепляет её позиции на рынке${
      input.audience ? ` среди аудитории «${input.audience}»` : ""
    }.`,
    factLines.length
      ? "Ключевые факты:\n" + factLines.map((f) => `• ${f.replace(/^[•\-\s]+/, "")}`).join("\n")
      : "Компания подготовила материал на основе проверенных данных.",
    input.kind === "analytics"
      ? "Представленные данные показывают устойчивую динамику и подтверждают релевантность продукта для целевого сегмента."
      : "Представители компании отмечают, что это лишь первый шаг в рамках более широкой дорожной карты развития.",
    "Материал подготовлен пресс-службой и прошёл редакционную модерацию платформы Asosiy Aktiv.",
  ].join("\n\n");

  return { title, lead, body };
}
