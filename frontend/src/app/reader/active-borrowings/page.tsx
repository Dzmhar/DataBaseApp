"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSort } from "@/lib/use-sort";

export default function ReaderActiveBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { sorted, sortKey, sortDir, toggleSort } = useSort(borrowings, "Tytul");

  useEffect(() => {
    if (!user || user.role !== "reader") {
      setLoading(false);
      return;
    }
    api.getReaderHistory(user.IdC)
      .then((data) => setBorrowings(data.filter((b: any) => !b.RzeczywistaDataZwrotu)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const isOverdue = (termin: string) => {
    if (!termin) return false;
    return new Date(termin) < new Date();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Aktywne wypożyczenia</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("Tytul")}>Książka{sortKey === "Tytul" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("NrEgzemplarza")}>Nr egzemplarza{sortKey === "NrEgzemplarza" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("DataWypozyczenia")}>Data wypożyczenia{sortKey === "DataWypozyczenia" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("TerminZwrotu")}>Termin zwrotu{sortKey === "TerminZwrotu" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.IdW} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">{b.Tytul}</td>
                  <td className="py-3 px-4">{b.NrEgzemplarza}</td>
                  <td className="py-3 px-4">{b.DataWypozyczenia}</td>
                  <td className="py-3 px-4">
                    <span className={isOverdue(b.TerminZwrotu) ? "text-red-600 font-semibold" : ""}>
                      {b.TerminZwrotu}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isOverdue(b.TerminZwrotu)
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {isOverdue(b.TerminZwrotu) ? "Po terminie" : "W trakcie"}
                    </span>
                  </td>
                </tr>
              ))}
              {borrowings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Brak aktywnych wypożyczeń
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
