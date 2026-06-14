"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function NewBorrowingPage() {
  const router = useRouter();
  const [readers, setReaders] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [copies, setCopies] = useState<any[]>([]);
  const [form, setForm] = useState({ idC: "", idK: "", idE: "", dni: "14" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getReaders().then(setReaders).catch((err) => setError(err.message));
    api.getBooks().then(setBooks).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (form.idK) {
      api.getCopies(parseInt(form.idK)).then(setCopies).catch((err) => setError(err.message));
    }
  }, [form.idK]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idC || !form.idE) return setError("Wybierz czytelnika i egzemplarz");
    setError("");
    setSubmitting(true);
    try {
      await api.borrow(parseInt(form.idC), parseInt(form.idE), parseInt(form.dni));
      router.push("/borrowings");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nowe wypożyczenie</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Czytelnik *</label>
          <select value={form.idC} onChange={(e) => setForm({ ...form, idC: e.target.value })} className="w-full border rounded-md px-3 py-2" required>
            <option value="">-- Wybierz --</option>
            {readers.map((r: any) => (
              <option key={r.IdC} value={r.IdC}>{r.Imie} {r.Nazwisko}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Książka *</label>
          <select value={form.idK} onChange={(e) => setForm({ ...form, idK: e.target.value, idE: "" })} className="w-full border rounded-md px-3 py-2" required>
            <option value="">-- Wybierz --</option>
            {books.map((b: any) => (
              <option key={b.IdK} value={b.IdK}>{b.Tytul} (dost.: {b.LiczbaDostepnych})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Egzemplarz *</label>
          <select value={form.idE} onChange={(e) => setForm({ ...form, idE: e.target.value })} className="w-full border rounded-md px-3 py-2" required>
            <option value="">-- Wybierz --</option>
            {copies.filter((c: any) => c.Status === "Dostepny").map((c: any) => (
              <option key={c.IdE} value={c.IdE}>#{c.IdE} - {c.Status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dni na zwrot</label>
          <input type="number" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} className="w-full border rounded-md px-3 py-2" min="1" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{submitting ? "Wypożyczanie..." : "Wypożycz"}</button>
          <button type="button" onClick={() => router.back()} className="bg-slate-200 px-4 py-2 rounded-md hover:bg-slate-300">Anuluj</button>
        </div>
      </form>
    </div>
  );
}
