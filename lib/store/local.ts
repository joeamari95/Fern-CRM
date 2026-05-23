"use client";

import { useCallback, useEffect, useState } from "react";

export const PREFIX = "finn:";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Storage key for a per-case section, e.g. caseKey("abc", "deadlines").
export function caseKey(caseId: string, section: string): string {
  return `case:${caseId}:${section}`;
}

// Synchronous, non-hook read — used for cross-case aggregation on the dashboard.
export function readCollection<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

// A persisted array of records. Renders empty until `ready` so server and first
// client render match (no hydration mismatch); real data loads after mount.
export function useCollection<T extends { id: string }>(key: string) {
  const storageKey = PREFIX + key;
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      alert("Could not save — browser storage may be full.");
    }
  }, [items, ready, storageKey]);

  const add = useCallback((item: T) => setItems((prev) => [item, ...prev]), []);
  const update = useCallback(
    (id: string, patch: Partial<T>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [],
  );
  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  return { items, add, update, remove, ready };
}

// A single persisted object. `value` is null when unset.
export function useLocalObject<T>(key: string) {
  const storageKey = PREFIX + key;
  const [value, setValueState] = useState<T | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setValueState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  const setValue = useCallback(
    (next: T | null) => {
      setValueState(next);
      try {
        if (next === null) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        alert("Could not save — browser storage may be full.");
      }
    },
    [storageKey],
  );

  return { value, setValue, ready };
}
