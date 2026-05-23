"use client";

// Client helpers for the /api/openai route. On failure they throw an Error
// whose `.missingKey` flag is true when OPENAI_API_KEY is not configured, so
// the UI can show the right message.

export class OpenAIError extends Error {
  missingKey: boolean;
  constructor(message: string, missingKey = false) {
    super(message);
    this.missingKey = missingKey;
  }
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503 || data.missingKey) {
      throw new OpenAIError(
        "OpenAI features require an API key. Add OPENAI_API_KEY to your environment variables.",
        true,
      );
    }
    console.error("[openai] request failed", res.status, data);
    throw new OpenAIError("Could not complete request. Please try again.");
  }
  return data as T;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const audio = await blobToDataUrl(blob);
  const { text } = await post<{ text: string }>({ feature: "whisper", audio, filename: "audio.webm" });
  return text;
}

export async function legalSearch(query: string): Promise<string> {
  const { text } = await post<{ text: string }>({ feature: "search", query });
  return text;
}

export type DocExtraction = {
  extracted_text?: string;
  document_type?: string;
  document_date?: string;
  parties?: string[] | string;
  deadlines?: string[] | string;
  action_items?: string[] | string;
};

export async function extractDocument(file: File): Promise<DocExtraction> {
  const image = await blobToDataUrl(file);
  const { data } = await post<{ data: DocExtraction }>({
    feature: "vision",
    image,
    mime: file.type,
    filename: file.name,
  });
  return data;
}

export async function generateNarrative(description: string): Promise<string> {
  const { text } = await post<{ text: string }>({ feature: "narrative", description });
  return text;
}
