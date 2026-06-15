"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDebounce } from "@/lib/use-debounce";
import { useSort } from "@/lib/use-sort";

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const isLibrarian = user?.role === "librarian";
  const debouncedSearch = useDebounce(search);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(books, "Tytul");

  useEffect(() => {
    api.getBooks(debouncedSearch).then(setBooks).catch((err) => setError(err.message));
  }, [debouncedSearch]);

  const handleDelete = async (idK: number) => {
    if (!confirm("Usunąć książkę?")) return;
    try {
      await api.deleteBook(idK);
      setBooks(books.filter((b) => b.IdK !== idK));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Książki</h1>
        {isLibrarian && (
          <Link href="/books/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
            + Dodaj książkę
          </Link>
        )}
      </div>
      <input
        type="text"
        placeholder="Szukaj po tytule, autorze lub ISBN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-md px-3 py-2 mb-4"
      />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Tytul")}>Tytuł{sortKey === "Tytul" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("Autorzy")}>Autorzy{sortKey === "Autorzy" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-left px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("ISBN")}>ISBN{sortKey === "ISBN" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-center px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("RokWydania")}>Rok{sortKey === "RokWydania" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-center px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("LiczbaEgzemplarzy")}>Sztuk{sortKey === "LiczbaEgzemplarzy" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              <th className="text-center px-4 py-2 cursor-pointer select-none" onClick={() => toggleSort("LiczbaDostepnych")}>Dostępne{sortKey === "LiczbaDostepnych" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
              {isLibrarian && <th className="text-center px-4 py-2">Akcje</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.IdK} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{b.Tytul}</td>
                <td className="px-4 py-2 text-slate-500">{b.Autorzy || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{b.ISBN || "-"}</td>
                <td className="px-4 py-2 text-center">{b.RokWydania || "-"}</td>
                <td className="px-4 py-2 text-center">{b.LiczbaEgzemplarzy || 0}</td>
                <td className="px-4 py-2 text-center">{b.LiczbaDostepnych || 0}</td>
                {isLibrarian && (
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Link href={`/books/${b.IdK}`} className="text-blue-600 hover:underline text-sm">
                        Edytuj
                      </Link>
                      <button onClick={() => handleDelete(b.IdK)} className="text-red-600 hover:underline text-sm">
                        Usuń
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={isLibrarian ? 7 : 6} className="text-center py-4 text-slate-400">
                  Brak książek
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
