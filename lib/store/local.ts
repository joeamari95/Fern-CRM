"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "fern:";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// A persisted array of records. Renders empty until `ready` so server and first
// client render match (no hydration mismatch); real data loads after mount.
export function useCollection<T extends { id: string }>(key: string) {
  const storageKey = PREFIX + key;
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt data */
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

// A single persisted object (e.g. the case profile). `value` is null when unset.
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
