"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function CopiesPage() {
  const [copies, setCopies] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBooks().then(setBooks).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api.getCopies(selectedBook ? parseInt(selectedBook) : undefined).then(setCopies).catch((err) => setError(err.message));
  }, [selectedBook]);

  const handleDelete = async (id: number) => {
    if (confirm("Usunąć egzemplarz?")) {
      await api.deleteCopy(id);
      setCopies(copies.filter((c) => c.IdE !== id));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Egzemplarze</h1>
      <div className="mb-4">
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">Wszystkie książki</option>
          {books.map((b: any) => (
            <option key={b.IdK} value={b.IdK}>{b.Tytul}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Książka</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((c) => (
              <tr key={c.IdE} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{c.IdE}</td>
                <td className="px-4 py-2">{c.Tytul}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.Status === "Dostepny" ? "bg-green-100 text-green-800" :
                    c.Status === "Wypozyczony" ? "bg-red-100 text-red-800" :
                    c.Status === "Zarezerwowany" ? "bg-amber-100 text-amber-800" :
                    "bg-slate-100 text-slate-800"
                  }`}>{c.Status}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleDelete(c.IdE)} className="text-red-600 hover:underline text-sm">Usuń</button>
                </td>
              </tr>
            ))}
            {copies.length === 0 && (
              <tr><td colSpan={4} className="text-center py-4 text-slate-400">Brak egzemplarzy</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
