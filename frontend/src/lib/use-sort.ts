"use client";

import { useState, useMemo } from "react";

type SortDir = "asc" | "desc";

export function useSort<T extends Record<string, any>>(data: T[], defaultKey?: string) {
  const [key, setKey] = useState<string>(defaultKey || "");
  const [dir, setDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), "pl");
      }
      return dir === "asc" ? cmp : -cmp;
    });
  }, [data, key, dir]);

  const toggle = (col: string) => {
    setKey((prev) => (prev === col ? prev : col));
    setDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return { sorted, sortKey: key, sortDir: dir, toggleSort: toggle };
}
