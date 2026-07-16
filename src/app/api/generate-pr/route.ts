import { NextResponse } from "next/server";
import { generatePR, type PRInput } from "@/lib/ai";
import { apiGuard } from "@/lib/api-guard";

// Real OpenAI (GPT-4o) when OPENAI_API_KEY is set; deterministic mock otherwise.
async function generateWithOpenAI(input: PRInput) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const kinds: Record<PRInput["kind"], string> = {
    launch: "запуск продукта",
    success: "история успеха",
    analytics: "аналитический материал",
    promo: "специальное предложение / акция",
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ты — редактор делового медиа Asosiy Aktiv. По фактам компании пиши сжатый PR-материал на русском без «воды». " +
          'Верни строго JSON: {"title": string, "lead": string, "body": string}. ' +
          "title ≤ 90 симв., lead — 1–2 предложения, body — 3–5 абзацев, абзацы разделены пустой строкой.",
      },
      {
        role: "user",
        content:
          `Тип: ${kinds[input.kind]}\nКомпания: ${input.company}\n` +
          (input.product ? `Продукт: ${input.product}\n` : "") +
          (input.audience ? `Аудитория: ${input.audience}\n` : "") +
          `Факты:\n${input.facts}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  if (!parsed.title || !parsed.body) throw new Error("bad model output");
  return { title: String(parsed.title), lead: String(parsed.lead || ""), body: String(parsed.body) };
}

export async function POST(req: Request) {
  const g = await apiGuard("news.create"); if (g.error) return g.error;
  const body = (await req.json()) as PRInput;
  if (!body?.company || !body?.facts) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Заполните компанию и факты." } },
      { status: 422 }
    );
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const data = await generateWithOpenAI(body);
      return NextResponse.json({ data, engine: "openai" });
    } catch (e) {
      // fall back to mock so the demo never breaks
      console.error("OpenAI failed, using mock:", (e as Error).message);
    }
  }

  await new Promise((r) => setTimeout(r, 500));
  return NextResponse.json({ data: generatePR(body), engine: "mock" });
}
