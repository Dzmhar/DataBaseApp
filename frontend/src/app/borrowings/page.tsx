"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function BorrowingsPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = () => api.getBorrowings(filter).then(setBorrowings).catch((err) => setError(err.message));
  useEffect(() => { load(); }, [filter]);

  const handleReturn = async (idW: number) => {
    if (confirm("Zwrócić egzemplarz?")) {
      await api.returnCopy(idW);
      load();
    }
  };

  const statusClass = (s: string) => {
    switch (s) {
      case "Zwrocona": return "bg-green-100 text-green-800";
      case "W trakcie": return "bg-blue-100 text-blue-800";
      case "Po terminie": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Wypożyczenia</h1>
        <Link href="/borrowings/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          + Nowe wypożyczenie
        </Link>
      </div>
      <div className="mb-4 flex gap-2">
        {["", "W trakcie", "Zwrocona", "Po terminie"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-sm ${filter === s ? "bg-slate-800 text-white" : "bg-white border hover:bg-slate-50"}`}
          >
            {s || "Wszystkie"}
          </button>
        ))}
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Czytelnik</th>
              <th className="text-left px-4 py-2">Tytuł</th>
              <th className="text-left px-4 py-2">Bibliotekarz</th>
              <th className="text-left px-4 py-2">Wypożyczono</th>
              <th className="text-left px-4 py-2">Termin</th>
              <th className="text-left px-4 py-2">Zwrot</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {borrowings.map((b) => (
              <tr key={b.IdW} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{b.IdW}</td>
                <td className="px-4 py-2">{b.Czytelnik}</td>
                <td className="px-4 py-2">{b.Tytul}</td>
                <td className="px-4 py-2">{b.Bibliotekarz}</td>
                <td className="px-4 py-2">{b.DataWypozyczenia}</td>
                <td className="px-4 py-2">{b.TerminZwrotu}</td>
                <td className="px-4 py-2">{b.RzeczywistaDataZwrotu || "-"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass(b.Status)}`}>{b.Status}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  {b.Status !== "Zwrocona" && (
                    <button onClick={() => handleReturn(b.IdW)} className="text-green-600 hover:underline text-sm">Zwróć</button>
                  )}
                </td>
              </tr>
            ))}
            {borrowings.length === 0 && (
              <tr><td colSpan={9} className="text-center py-4 text-slate-400">Brak wypożyczeń</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
