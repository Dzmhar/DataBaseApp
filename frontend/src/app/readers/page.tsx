"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";

export default function ReadersPage() {
  const [readers, setReaders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    api.getReaders(debouncedSearch).then(setReaders).catch((err) => setError(err.message));
  }, [debouncedSearch]);

  const handleDelete = async (id: number) => {
    if (confirm("Usunąć czytelnika?")) {
      await api.deleteReader(id);
      setReaders(readers.filter((r) => r.IdC !== id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Czytelnicy</h1>
        <Link href="/readers/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          + Dodaj czytelnika
        </Link>
      </div>
      <input
        type="text"
        placeholder="Szukaj czytelnika..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-md px-3 py-2 mb-4"
      />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Nazwisko</th>
              <th className="text-left px-4 py-2">Imię</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Telefon</th>
              <th className="text-center px-4 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {readers.map((r) => (
              <tr key={r.IdC} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{r.Nazwisko}</td>
                <td className="px-4 py-2">{r.Imie}</td>
                <td className="px-4 py-2 text-slate-500">{r.Email || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{r.Telefon || "-"}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <Link href={`/readers/${r.IdC}`} className="text-blue-600 hover:underline text-sm">Edytuj</Link>
                    <button onClick={() => handleDelete(r.IdC)} className="text-red-600 hover:underline text-sm">Usuń</button>
                  </div>
                </td>
              </tr>
            ))}
            {readers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-slate-400">Brak czytelników</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
