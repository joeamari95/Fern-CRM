"use client";

import { useRef, useState } from "react";
import { extractDocument, blobToDataUrl, OpenAIError, type DocExtraction } from "@/lib/openai";

function asText(v: string[] | string | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join("; ") : v;
}
function asList(v: string[] | string | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// Camera/upload → OpenAI Vision → review → prefill the section's entry form.
// `mapToFields` converts the extraction into the section's form field values.
export default function DocIngest({
  mapToFields,
  onApply,
}: {
  mapToFields: (d: DocExtraction) => Record<string, string>;
  onApply: (prefill: Record<string, string>) => void;
}) {
  const [stage, setStage] = useState<"closed" | "capture" | "review">("closed");
  const [preview, setPreview] = useState<string>("");
  const [isPdf, setIsPdf] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DocExtraction | null>(null);

  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("closed");
    setPreview("");
    setIsPdf(false);
    setFileName("");
    setLoading(false);
    setError("");
    setData(null);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setStage("review");
    setError("");
    setData(null);
    setFileName(f.name);
    const pdf = f.type === "application/pdf";
    setIsPdf(pdf);
    try {
      if (!pdf) setPreview(await blobToDataUrl(f));
    } catch {
      /* preview optional */
    }
    setLoading(true);
    try {
      setData(await extractDocument(f));
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : "Could not complete request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="icon-btn" onClick={() => setStage("capture")} title="Scan a document" aria-label="Scan a document">
        📷
      </button>

      {stage === "capture" && (
        <div className="modal-overlay" onMouseDown={reset}>
          <div className="modal-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Scan a document</h3>
              <button className="icon-btn" onClick={reset}>✕</button>
            </div>
            <p className="text-[12.5px] text-[var(--muted)] mb-4">
              Take a photo or upload a PDF/JPG/PNG. The text and key details will be extracted for
              your review before saving.
            </p>
            <div className="flex flex-col gap-2.5">
              <button className="btn btn-accent" onClick={() => camRef.current?.click()}>
                📸 Take Photo
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                ⤴ Upload File
              </button>
            </div>
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="modal-overlay" onMouseDown={reset}>
          <div className="modal-panel modal-wide" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Review extracted document</h3>
              <button className="icon-btn" onClick={reset}>✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: the source */}
              <div className="card-2 p-3 flex items-center justify-center min-h-[180px]">
                {isPdf ? (
                  <div className="text-center text-[13px] text-[var(--muted)]">
                    📕<div className="mt-2">{fileName}</div>
                  </div>
                ) : preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Scanned document" className="max-h-[320px] rounded-md" />
                ) : (
                  <span className="text-[12px] text-[var(--faint)]">No preview</span>
                )}
              </div>

              {/* Right: extracted data */}
              <div className="flex flex-col gap-3 min-w-0">
                {loading && <p className="text-[13px] text-[var(--muted)]">Reading the document…</p>}
                {error && <p className="text-[13px] text-[var(--rose)]">{error}</p>}
                {data && !loading && (
                  <>
                    <div>
                      <div className="field-label">Document Type</div>
                      <div className="text-[14px] font-medium">{data.document_type || "Unknown"}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Detail label="Date" value={asText(data.document_date)} />
                      <Detail label="Parties" value={asText(data.parties)} />
                    </div>
                    <Detail label="Deadlines / Dates" value={asText(data.deadlines)} />
                    {asList(data.action_items).length > 0 && (
                      <div>
                        <div className="field-label">Action Items</div>
                        <ul className="list-disc pl-4 text-[12.5px] text-[var(--muted)]">
                          {asList(data.action_items).map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div className="field-label">Extracted Text</div>
                      <div className="card-2 p-2.5 max-h-[160px] overflow-y-auto text-[12px] text-[var(--muted)] whitespace-pre-wrap">
                        {data.extracted_text || "(none)"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={reset}>Cancel</button>
              <button
                className="btn btn-accent"
                disabled={!data || loading}
                onClick={() => {
                  if (data) onApply(mapToFields(data));
                  reset();
                }}
              >
                Use in entry →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="field-label">{label}</div>
      <div className="text-[13px] text-[var(--muted)] break-words">{value || "—"}</div>
    </div>
  );
}
