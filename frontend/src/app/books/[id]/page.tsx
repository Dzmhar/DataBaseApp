"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [copies, setCopies] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ tytul: "", isbn: "", rokWydania: "" });
  const [error, setError] = useState("");

  const isLibrarian = user?.role === "librarian";

  useEffect(() => {
    api.getBook(parseInt(id)).then(setBook).catch((err) => setError(err.message));
    api.getCopies(parseInt(id)).then(setCopies).catch((err) => setError(err.message));
    api.getBookAuthors(parseInt(id)).then(setAuthors).catch((err) => setError(err.message));
  }, [id]);

  const handleDelete = async () => {
    if (confirm("Usunąć książkę?")) {
      await api.deleteBook(parseInt(id));
      router.push("/books");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateBook(parseInt(id), {
      tytul: form.tytul,
      isbn: form.isbn || undefined,
      rokWydania: form.rokWydania ? parseInt(form.rokWydania) : undefined,
    });
    setEditing(false);
    api.getBook(parseInt(id)).then(setBook).catch((err) => setError(err.message));
  };

  const handleAddCopy = async () => {
    try {
      const res = await api.addCopy(parseInt(id));
      setCopies([...copies, { IdE: res.IdE, IdK: parseInt(id), Status: "Dostepny" }]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refreshBook = () => {
    api.getBook(parseInt(id)).then(setBook).catch((err) => setError(err.message));
    api.getBookAuthors(parseInt(id)).then(setAuthors).catch((err) => setError(err.message));
  };

  const handleAssignAuthor = async (idA: number) => {
    await api.assignAuthor(idA, parseInt(id));
    refreshBook();
  };

  const handleUnassignAuthor = async (idA: number) => {
    await api.unassignAuthor(idA, parseInt(id));
    refreshBook();
  };

  const startEdit = () => {
    setForm({ tytul: book.Tytul, isbn: book.ISBN || "", rokWydania: book.RokWydania?.toString() || "" });
    setEditing(true);
  };

  if (!book) return <p>Ładowanie...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{book.Tytul}</h1>
        {isLibrarian && (
          <div className="flex gap-2">
            <button onClick={startEdit} className="bg-amber-500 text-white px-3 py-1 rounded text-sm">Edytuj</button>
            <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Usuń</button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input type="text" value={form.tytul} onChange={(e) => setForm({ ...form, tytul: e.target.value })} className="w-full border rounded px-3 py-2" required />
          <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="ISBN" />
          <input type="number" value={form.rokWydania} onChange={(e) => setForm({ ...form, rokWydania: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Rok" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Zapisz</button>
            <button type="button" onClick={() => setEditing(false)} className="bg-slate-200 px-3 py-1 rounded text-sm">Anuluj</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <p><span className="font-medium">ISBN:</span> {book.ISBN || "-"}</p>
          <p><span className="font-medium">Rok wydania:</span> {book.RokWydania || "-"}</p>
          <p><span className="font-medium">Autorzy:</span> {book.Autorzy || "-"}</p>
          <p><span className="font-medium">Egzemplarze:</span> {book.LiczbaEgzemplarzy || 0} (dostępne: {book.LiczbaDostepnych || 0})</p>
        </div>
      )}

      {isLibrarian && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Egzemplarze</h2>
            <button onClick={handleAddCopy} className="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Dodaj egzemplarz</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {copies.map((c) => (
                <tr key={c.IdE} className="border-b">
                  <td className="py-2">{c.IdE}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.Status === "Dostepny" ? "bg-green-100 text-green-800" :
                      c.Status === "Wypozyczony" ? "bg-red-100 text-red-800" :
                      c.Status === "Zarezerwowany" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>{c.Status}</span>
                  </td>
                </tr>
              ))}
              {copies.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-slate-400">Brak egzemplarzy</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
