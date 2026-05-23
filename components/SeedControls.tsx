"use client";

import { seedAll, clearAll } from "@/lib/data/seed";

export default function SeedControls({ hasData }: { hasData: boolean }) {
  function load() {
    if (hasData && !confirm("Load the 11 sample cases? This replaces current data.")) return;
    seedAll();
    location.reload();
  }
  function clear() {
    if (!confirm("Clear ALL data and uploaded files? This cannot be undone.")) return;
    clearAll();
    location.reload();
  }
  return (
    <div className="flex items-center justify-center gap-3 mt-6 text-[12px]">
      <button className="btn btn-accent" onClick={load}>
        ⤓ Load sample cases
      </button>
      {hasData && (
        <button className="btn" onClick={clear}>
          Clear all data
        </button>
      )}
    </div>
  );
}
