"use client";

import { seedSampleData, clearAllData } from "@/lib/data/sample";

export default function DemoControls({ hasData }: { hasData: boolean }) {
  function load() {
    if (hasData && !confirm("Load the sample matter? This replaces your current data.")) return;
    seedSampleData();
    location.reload();
  }
  function clear() {
    if (!confirm("Clear ALL data and uploaded files? This cannot be undone.")) return;
    clearAllData();
    location.reload();
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-6 text-[12px]">
      <button className="btn btn-accent" onClick={load}>
        ⤓ Load sample matter
      </button>
      {hasData && (
        <button className="btn" onClick={clear}>
          Clear all data
        </button>
      )}
    </div>
  );
}
