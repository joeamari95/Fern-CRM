import Anthropic from "@anthropic-ai/sdk";

// Server-side proxy so the API key never reaches the browser bundle.
// Key is read from REACT_APP_ANTHROPIC_KEY (the configured name) with a fallback.
const MODEL = "claude-sonnet-4-20250514";

export async function POST(req: Request) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "API key not configured. Set REACT_APP_ANTHROPIC_KEY in the environment." },
      { status: 503 },
    );
  }

  let body: { system?: string; user?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { system, user } = body;
  if (!system || !user) {
    return Response.json({ error: "Missing system or user content." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      // Cache the static system prompt — it repeats across calls.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return Response.json({ text });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Claude API error (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    return Response.json({ error: "Unexpected error calling Claude." }, { status: 500 });
  }
}
