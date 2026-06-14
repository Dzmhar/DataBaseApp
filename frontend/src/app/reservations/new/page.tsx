"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewReservationPage() {
  const router = useRouter();
  const [readers, setReaders] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [form, setForm] = useState({ idC: "", idK: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getReaders().then(setReaders).catch((err) => setError(err.message));
    api.getBooks().then(setBooks).catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idC || !form.idK) return setError("Wybierz czytelnika i książkę");
    setError("");
    setSubmitting(true);
    try {
      await api.reserve(parseInt(form.idK), parseInt(form.idC));
      router.push("/reservations");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nowa rezerwacja</h1>
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
          <select value={form.idK} onChange={(e) => setForm({ ...form, idK: e.target.value })} className="w-full border rounded-md px-3 py-2" required>
            <option value="">-- Wybierz --</option>
            {books.map((b: any) => (
              <option key={b.IdK} value={b.IdK}>{b.Tytul}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{submitting ? "Rezerwowanie..." : "Zarezerwuj"}</button>
          <button type="button" onClick={() => router.back()} className="bg-slate-200 px-4 py-2 rounded-md hover:bg-slate-300">Anuluj</button>
        </div>
      </form>
    </div>
  );
}
