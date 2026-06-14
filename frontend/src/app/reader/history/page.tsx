"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ReaderHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "reader") {
      setLoading(false);
      return;
    }
    api.getReaderHistory(user.IdC)
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Historia wypożyczeń</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4">Książka</th>
                <th className="text-left py-3 px-4">Nr egzemplarza</th>
                <th className="text-left py-3 px-4">Data wypożyczenia</th>
                <th className="text-left py-3 px-4">Termin zwrotu</th>
                <th className="text-left py-3 px-4">Data zwrotu</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.IdW} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">{h.Tytul}</td>
                  <td className="py-3 px-4">{h.NrEgzemplarza}</td>
                  <td className="py-3 px-4">{h.DataWypozyczenia}</td>
                  <td className="py-3 px-4">{h.TerminZwrotu}</td>
                  <td className="py-3 px-4">{h.RzeczywistaDataZwrotu || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.Status === "Zwrocona" ? "bg-green-100 text-green-800" :
                      h.Status === "Po terminie" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {h.Status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Brak historii wypożyczeń
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
