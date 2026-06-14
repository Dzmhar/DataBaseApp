"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDebounce } from "@/lib/use-debounce";

export default function ReaderBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    api.getBooks(debouncedSearch).then(setBooks).catch((err) => setMessage(err.message)).finally(() => setLoading(false));
  }, [debouncedSearch]);

  const handleReserve = async (idK: number) => {
    if (!user || user.role !== "reader") return;
    setReserving(idK);
    setMessage("");
    try {
      await api.reserve(idK);
      setMessage("Zarezerwowano pomyślnie!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setReserving(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Książki</h1>
      <input
        type="text"
        placeholder="Szukaj książki..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {message && (
        <p className={`mb-4 text-sm ${message.includes("pomyślnie") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.IdK} className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold">{book.Tytul}</h2>
              <p className="text-sm text-slate-500">
                {book.Autorzy || "Nieznany autor"}
              {book.RokWydania ? ` (${book.RokWydania})` : ""}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                ISBN: {book.ISBN || "-"}
              </p>
              <p className="text-sm mt-2">
                Dostępne egzemplarze:{" "}
                <span className="font-semibold">{book.LiczbaDostepnych || 0}</span>
              </p>
              <button
                onClick={() => handleReserve(book.IdK)}
                disabled={reserving === book.IdK || (book.LiczbaDostepnych || 0) === 0}
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {reserving === book.IdK ? "Rezerwowanie..." : "Rezerwuj"}
              </button>
            </div>
          ))}
          {books.length === 0 && (
            <p className="text-slate-400 col-span-full text-center py-8">
              Brak książek
            </p>
          )}
        </div>
      )}
    </div>
  );
}
