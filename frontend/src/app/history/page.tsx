"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSort } from "@/lib/use-sort";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState("");
  const { sorted, sortKey, sortDir, toggleSort } = useSort(history, "RzeczywistaDataZwrotu");

  useEffect(() => {
    api.getBorrowingsHistory().then(setHistory).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Historia wypożyczeń</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("IdW")}>ID{sortKey === "IdW" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Czytelnik")}>Czytelnik{sortKey === "Czytelnik" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Tytul")}>Tytuł{sortKey === "Tytul" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("NrEgzemplarza")}>Nr egzemplarza{sortKey === "NrEgzemplarza" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Bibliotekarz")}>Bibliotekarz{sortKey === "Bibliotekarz" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("DataWypozyczenia")}>Wypożyczono{sortKey === "DataWypozyczenia" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("TerminZwrotu")}>Termin{sortKey === "TerminZwrotu" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("RzeczywistaDataZwrotu")}>Data zwrotu{sortKey === "RzeczywistaDataZwrotu" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Status")}>Status{sortKey === "Status" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.IdW} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{h.IdW}</td>
                <td className="px-4 py-2">{h.Czytelnik}</td>
                <td className="px-4 py-2">{h.Tytul}</td>
                <td className="px-4 py-2">{h.NrEgzemplarza}</td>
                <td className="px-4 py-2">{h.Bibliotekarz}</td>
                <td className="px-4 py-2">{h.DataWypozyczenia}</td>
                <td className="px-4 py-2">{h.TerminZwrotu}</td>
                <td className="px-4 py-2">{h.RzeczywistaDataZwrotu}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Zwrócona
                  </span>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={9} className="text-center py-4 text-slate-400">Brak historii</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
