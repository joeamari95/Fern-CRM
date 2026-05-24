import OpenAI, { toFile } from "openai";

// Server-side AI route. Per-feature backend:
//   whisper (audio)  -> OpenAI (Perplexity has no audio)
//   vision  (image)  -> OpenAI (Perplexity has no image input)
//   search           -> Perplexity (sonar-pro, web search)
//   narrative        -> Perplexity (sonar-pro)
const OPENAI_MISSING =
  "OpenAI features require an API key. Add REACT_APP_OPENAI_API_KEY to your environment variables.";
const PPLX_MISSING =
  "Perplexity features require an API key. Add REACT_APP_PERPLEXITY_KEY to your environment variables.";

const PPLX_URL = "https://api.perplexity.ai/chat/completions";
const PPLX_MODEL = "sonar-pro";

const SEARCH_SYSTEM = `You are a legal research assistant embedded inside FernCRM, a case management platform used by Finn O'Connell, an associate attorney at Wilson Elser specializing in premises liability defense in New York. The default jurisdiction is New York. The default court is the First Judicial Department. The default posture is defense. Unless the user specifies otherwise, always search for decisions favorable to the defendant, always filter to New York First Department, and always return results relevant to premises liability defense. Return 3 to 5 cases maximum. For each case return the full case name, citation, court, year, one sentence FHR covering Facts Holding and Reasoning, a Favorable To tag of either Plaintiff or Defendant, and a direct URL to the full opinion on Justia or CourtListener. Never return a case that contradicts the favorable-to parameter. Always return your best 3 to 5 results even if you are not fully certain they match every parameter. For each case clearly flag your confidence as High, Medium, or Low and explain in one sentence why it may or may not match the query. Never refuse to return results. The attorney will verify everything on Lexis himself.

You are a legal research assistant for a New York litigation associate. Use web search and prefer these public sources: Google Scholar, CourtListener (courtlistener.com), law.justia.com, nycourts.gov, and law.cornell.edu.

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

async function perplexity(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: PPLX_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Perplexity ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const feature = body.feature as string;
  const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const pplxKey = process.env.REACT_APP_PERPLEXITY_KEY;

  try {
    /* ---- Perplexity-backed features ---- */
    if (feature === "search") {
      if (!pplxKey) return Response.json({ error: PPLX_MISSING, missingKey: true }, { status: 503 });
      const query = String(body.query || "").trim();
      if (!query) return Response.json({ error: "No query provided." }, { status: 400 });
      const text = await perplexity(pplxKey, SEARCH_SYSTEM, query);
      return Response.json({ text });
    }

    if (feature === "narrative") {
      if (!pplxKey) return Response.json({ error: PPLX_MISSING, missingKey: true }, { status: 503 });
      const description = String(body.description || "").trim();
      if (!description) return Response.json({ error: "No description provided." }, { status: 400 });
      const text = await perplexity(pplxKey, NARRATIVE_SYSTEM, description);
      return Response.json({ text });
    }

    /* ---- OpenAI-backed features (audio + image, which Perplexity can't do) ---- */
    if (feature === "whisper") {
      if (!openaiKey) return Response.json({ error: OPENAI_MISSING, missingKey: true }, { status: 503 });
      const dataUrl = String(body.audio || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      if (!base64) return Response.json({ error: "No audio provided." }, { status: 400 });
      const buf = Buffer.from(base64, "base64");
      const filename = (body.filename as string) || "audio.webm";
      const file = await toFile(buf, filename);
      const client = new OpenAI({ apiKey: openaiKey });
      const tr = await client.audio.transcriptions.create({ file, model: "whisper-1" });
      return Response.json({ text: tr.text });
    }

    if (feature === "vision") {
      if (!openaiKey) return Response.json({ error: OPENAI_MISSING, missingKey: true }, { status: 503 });
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
      const client = new OpenAI({ apiKey: openaiKey });
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

    return Response.json({ error: "Unknown feature." }, { status: 400 });
  } catch (error) {
    console.error("[/api/openai] error:", error);
    const msg = error instanceof Error ? error.message : "Request failed.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
