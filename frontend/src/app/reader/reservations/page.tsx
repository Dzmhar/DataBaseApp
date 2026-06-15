"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSort } from "@/lib/use-sort";

export default function ReaderReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { sorted, sortKey, sortDir, toggleSort } = useSort(reservations, "Tytul");

  const loadReservations = async () => {
    if (!user || user.role !== "reader") return;
    setLoading(true);
    try {
      const data = await api.getMyReservations();
      setReservations(data.filter((r: any) => r.StatusRezerwacji === "Aktywna"));
    } catch {
      setMessage("Nie udało się załadować rezerwacji");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [user]);

  const handleCancel = async (idR: number) => {
    setMessage("");
    try {
      await api.cancelReservation(idR);
      setMessage("Rezerwacja anulowana");
      loadReservations();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Moje rezerwacje</h1>
      {message && (
        <p className={`mb-4 text-sm ${message.includes("anulowana") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("Tytul")}>Książka{sortKey === "Tytul" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("DataRezerwacji")}>Data rezerwacji{sortKey === "DataRezerwacji" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.IdR} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">{r.Tytul}</td>
                  <td className="py-3 px-4">{r.DataRezerwacji}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.StatusRezerwacji === "Aktywna"
                        ? "bg-green-100 text-green-800"
                        : r.StatusRezerwacji === "Anulowana"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-800"
                    }`}>
                      {r.StatusRezerwacji}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.StatusRezerwacji === "Aktywna" && (
                      <button
                        onClick={() => handleCancel(r.IdR)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Anuluj
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Brak rezerwacji
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
