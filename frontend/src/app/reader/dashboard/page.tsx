"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ReaderDashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "reader") return;
    Promise.all([
      api.getMyReservations().catch(() => []),
      user ? api.getReaderHistory(user.IdC).catch(() => []) : Promise.resolve([]),
    ]).then(([res, hist]) => {
      setReservations(res.filter((r: any) => r.StatusRezerwacji === "Aktywna"));
      setBorrowings(hist.filter((h: any) => !h.RzeczywistaDataZwrotu));
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard czytelnika</h1>
      <p className="text-slate-600 mb-6">
        Witaj, {user?.Imie} {user?.Nazwisko}!
      </p>
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Książki</h2>
            <p className="text-3xl font-bold text-blue-600">{reservations.length + borrowings.length}</p>
            <p className="text-slate-500 text-sm">Aktywne wypożyczenia i rezerwacje</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Rezerwacje</h2>
            <p className="text-3xl font-bold text-amber-600">{reservations.length}</p>
            <p className="text-slate-500 text-sm">Aktywne rezerwacje</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Wypożyczenia</h2>
            <p className="text-3xl font-bold text-green-600">{borrowings.length}</p>
            <p className="text-slate-500 text-sm">Aktualnie wypożyczone</p>
          </div>
        </div>
      )}
    </div>
  );
}
