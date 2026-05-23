"use client";

export type ChatMsg = { role: "user" | "assistant"; content: string };

// Single-turn call (system + one user message).
export async function callClaude(system: string, user: string): Promise<string> {
  return post({ system, user });
}

// Multi-turn call (system + full conversation history).
export async function callClaudeMessages(system: string, messages: ChatMsg[]): Promise<string> {
  return post({ system, messages });
}

async function post(payload: Record<string, unknown>): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data.text ?? "";
}
