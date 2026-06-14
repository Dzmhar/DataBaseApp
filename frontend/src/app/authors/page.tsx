"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAuthors().then(setAuthors).catch((err) => setError(err.message));
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Usunąć autora?")) {
      await api.deleteAuthor(id);
      setAuthors(authors.filter((a) => a.IdA !== id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Autorzy</h1>
        <Link href="/authors/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          + Dodaj autora
        </Link>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Nazwisko</th>
              <th className="text-left px-4 py-2">Imię</th>
              <th className="text-center px-4 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((a) => (
              <tr key={a.IdA} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{a.Nazwisko}</td>
                <td className="px-4 py-2">{a.Imie}</td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleDelete(a.IdA)} className="text-red-600 hover:underline text-sm">Usuń</button>
                </td>
              </tr>
            ))}
            {authors.length === 0 && (
              <tr><td colSpan={3} className="text-center py-4 text-slate-400">Brak autorów</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
