import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function jsonFromLLM<T>(opts: {
  system: string;
  prompt: string;
  schemaName: string;
  validate: (obj: unknown) => T;
}): Promise<T> {
  const first = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.prompt },
    ],
  });

  const text1 = first.choices[0]?.message?.content ?? "";
  const parsed1 = safeJsonParse(text1);

  if (parsed1.ok) {
    try {
      return opts.validate(parsed1.value);
    } catch {}
  }

  // One repair attempt
  const repair = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "You fix JSON to match a schema. Return JSON only. No markdown.",
      },
      {
        role: "user",
        content:
          `Fix the following to be valid JSON matching schema "${opts.schemaName}". ` +
          `Return JSON only.\n\n${text1}`,
      },
    ],
  });

  const text2 = repair.choices[0]?.message?.content ?? "";
  const parsed2 = safeJsonParse(text2);

  if (!parsed2.ok) throw new Error("LLM_JSON_PARSE_FAILED");
  return opts.validate(parsed2.value);
}

function safeJsonParse(
  text: string
): { ok: true; value: unknown } | { ok: false } {
  try {
    const trimmed = text.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1) return { ok: false };
    const slice = trimmed.slice(start, end + 1);
    return { ok: true, value: JSON.parse(slice) };
  } catch {
    return { ok: false };
  }
}

