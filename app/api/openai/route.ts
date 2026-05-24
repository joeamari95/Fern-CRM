import OpenAI, { toFile } from "openai";

// Single server-side route for all three OpenAI features. The key stays here.
// feature: "whisper" | "search" | "vision" | "narrative"
const MISSING_KEY_MSG =
  "OpenAI features require an API key. Add OPENAI_API_KEY to your environment variables.";

const SEARCH_SYSTEM = `You are a legal research assistant for a New York litigation associate. Use web search and prefer these public sources: Google Scholar, CourtListener (courtlistener.com), law.justia.com, nycourts.gov, and law.cornell.edu.

Respond in exactly these labeled sections and nothing else:
ANSWER: a direct 2-3 sentence answer.
RELEVANT CASES: a list of cases found, each with its citation. If none, say "None found."
NEXT STEP: suggested Westlaw or LexisNexis search terms.

Do not invent citations. Only list cases you actually found in search results.`;

const VISION_SYSTEM = `Extract all text from this document exactly as written. Then identify what type of legal document this is and the key details:
- Document type
- Date of document
- Parties involved
- Key deadlines or dates mentioned
- Any action items
Return ONLY structured JSON with fields: extracted_text, document_type, document_date, parties, deadlines, action_items.`;

const NARRATIVE_SYSTEM = `You are a legal billing assistant. Turn the attorney's terse time-entry description into a single concise, professional billing narrative in past tense (one short paragraph, no bullet points, no first person). Do not invent work that was not described. Return only the narrative text.`;

export async function POST(req: Request) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: MISSING_KEY_MSG, missingKey: true }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const feature = body.feature as string;
  const client = new OpenAI({ apiKey });

  try {
    if (feature === "whisper") {
      const dataUrl = String(body.audio || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      if (!base64) return Response.json({ error: "No audio provided." }, { status: 400 });
      const buf = Buffer.from(base64, "base64");
      const filename = (body.filename as string) || "audio.webm";
      const file = await toFile(buf, filename);
      const tr = await client.audio.transcriptions.create({ file, model: "whisper-1" });
      return Response.json({ text: tr.text });
    }

    if (feature === "search") {
      const query = String(body.query || "").trim();
      if (!query) return Response.json({ error: "No query provided." }, { status: 400 });
      const res = await client.responses.create({
        model: "gpt-4o",
        tools: [{ type: "web_search_preview" }],
        instructions: SEARCH_SYSTEM,
        input: query,
      });
      return Response.json({ text: res.output_text });
    }

    if (feature === "vision") {
      const dataUrl = String(body.image || "");
      const mime = (body.mime as string) || "";
      if (!dataUrl) return Response.json({ error: "No file provided." }, { status: 400 });
      const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
        { type: "text", text: "Extract and classify this document." },
      ];
      if (mime === "application/pdf") {
        userContent.push({
          type: "file",
          file: { filename: (body.filename as string) || "document.pdf", file_data: dataUrl },
        });
      } else {
        userContent.push({ type: "image_url", image_url: { url: dataUrl } });
      }
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: VISION_SYSTEM },
          { role: "user", content: userContent },
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      let data: unknown = {};
      try {
        data = JSON.parse(raw);
      } catch {
        /* keep raw */
      }
      return Response.json({ data, raw });
    }

    if (feature === "narrative") {
      const description = String(body.description || "").trim();
      if (!description) return Response.json({ error: "No description provided." }, { status: 400 });
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: NARRATIVE_SYSTEM },
          { role: "user", content: description },
        ],
      });
      return Response.json({ text: completion.choices[0]?.message?.content ?? "" });
    }

    return Response.json({ error: "Unknown feature." }, { status: 400 });
  } catch (error) {
    console.error("[/api/openai] error:", error);
    const msg = error instanceof Error ? error.message : "OpenAI request failed.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
