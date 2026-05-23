"use client";

// Calls the server-side /api/claude proxy. Throws with a readable message on failure.
export async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data.text ?? "";
}
