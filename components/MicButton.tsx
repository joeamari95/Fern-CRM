"use client";

import { useRef, useState } from "react";
import { transcribeAudio, OpenAIError } from "@/lib/openai";

type State = "idle" | "recording" | "processing";

// Minimal mic capture → Whisper transcription. Calls onText with the result.
export default function MicButton({
  onText,
  title = "Dictate",
}: {
  onText: (text: string) => void;
  title?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setState("processing");
        try {
          const text = await transcribeAudio(blob);
          if (text) onText(text);
          setState("idle");
        } catch (err) {
          setState("idle");
          setError(err instanceof OpenAIError ? err.message : "Could not transcribe. Please try again.");
        }
      };
      rec.start();
      recRef.current = rec;
      setState("recording");
    } catch {
      setError("Microphone access is needed to dictate. Enable it in your browser's site settings, then try again.");
    }
  }

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
  }

  function toggle() {
    if (state === "recording") stop();
    else if (state === "idle") start();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={`mic-btn${state === "recording" ? " recording" : ""}`}
        onClick={toggle}
        disabled={state === "processing"}
        aria-label={title}
        title={title}
      >
        {state === "processing" ? <span className="mic-spinner" /> : state === "recording" ? "■" : "🎤"}
      </button>
      {state === "recording" && (
        <span className="mic-status">
          <span className="mic-dot" /> Recording…
        </span>
      )}
      {error && <span className="mic-error">{error}</span>}
    </span>
  );
}
