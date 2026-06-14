"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewAuthorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nazwisko: "", imie: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazwisko || !form.imie) return setError("Wszystkie pola są wymagane");
    setError("");
    setSubmitting(true);
    try {
      await api.addAuthor(form);
      router.push("/authors");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dodaj autora</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nazwisko *</label>
          <input type="text" value={form.nazwisko} onChange={(e) => setForm({ ...form, nazwisko: e.target.value })} className="w-full border rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Imię *</label>
          <input type="text" value={form.imie} onChange={(e) => setForm({ ...form, imie: e.target.value })} className="w-full border rounded-md px-3 py-2" required />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{submitting ? "Zapisywanie..." : "Zapisz"}</button>
          <button type="button" onClick={() => router.back()} className="bg-slate-200 px-4 py-2 rounded-md hover:bg-slate-300">Anuluj</button>
        </div>
      </form>
    </div>
  );
}
