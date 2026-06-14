"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = () => api.getReservations().then(setReservations).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const handleCancel = async (idR: number) => {
    if (confirm("Anulować rezerwację?")) {
      await api.cancelReservation(idR);
      load();
    }
  };

  const statusClass = (s: string) => {
    switch (s) {
      case "Aktywna": return "bg-green-100 text-green-800";
      case "Zrealizowana": return "bg-blue-100 text-blue-800";
      case "Anulowana": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rezerwacje</h1>
        <Link href="/reservations/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          + Nowa rezerwacja
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Czytelnik</th>
              <th className="text-left px-4 py-2">Książka</th>
              <th className="text-left px-4 py-2">Data rezerwacji</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.IdR} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{r.IdR}</td>
                <td className="px-4 py-2">{r.Czytelnik}</td>
                <td className="px-4 py-2">{r.Tytul}</td>
                <td className="px-4 py-2">{r.DataRezerwacji}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass(r.StatusRezerwacji)}`}>{r.StatusRezerwacji}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  {r.StatusRezerwacji === "Aktywna" && (
                    <button onClick={() => handleCancel(r.IdR)} className="text-red-600 hover:underline text-sm">Anuluj</button>
                  )}
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-slate-400">Brak rezerwacji</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
