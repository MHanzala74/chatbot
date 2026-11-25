export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  "You are a friendly, helpful assistant. Keep answers clear and concise.";
const MAX_MESSAGES = 20;

const DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  anthropic: "claude-sonnet-5-5",
};

const KEY_VARS = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

// Use LLM_PROVIDER if set, otherwise pick the first provider that has a key.
function pickProvider() {
  const forced = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (KEY_VARS[forced]) return forced;
  return Object.keys(KEY_VARS).find((p) => process.env[KEY_VARS[p]]) || null;
}

async function callOpenAI(apiKey, model, messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI returned an error.");
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(apiKey, model, messages) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini returned an error.");
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

async function callAnthropic(apiKey, model, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Claude returned an error.");
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

const CALLERS = { openai: callOpenAI, gemini: callGemini, anthropic: callAnthropic };

export async function POST(request) {
  const provider = pickProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          "No API key found. Set OPENAI_API_KEY or GEMINI_API_KEY (or ANTHROPIC_API_KEY) in your environment variables.",
      },
      { status: 500 }
    );
  }
  const apiKey = process.env[KEY_VARS[provider]];
  if (!apiKey) {
    return Response.json(
      { error: `LLM_PROVIDER is "${provider}" but ${KEY_VARS[provider]} is not set.` },
      { status: 500 }
    );
  }
  const model = process.env.LLM_MODEL || DEFAULT_MODELS[provider];

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const cleaned = messages
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim() !== ""
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return Response.json({ error: "Send at least one user message." }, { status: 400 });
  }

  try {
    const reply = await CALLERS[provider](apiKey, model, cleaned);
    return Response.json({ reply });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Could not reach the AI service." },
      { status: 502 }
    );
  }
}
