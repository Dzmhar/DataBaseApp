"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewBookPage() {
  const router = useRouter();
  const [form, setForm] = useState({ tytul: "", isbn: "", rokWydania: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tytul) return setError("Tytuł jest wymagany");
    setError("");
    setSubmitting(true);
    try {
      await api.addBook({
        tytul: form.tytul,
        isbn: form.isbn || undefined,
        rokWydania: form.rokWydania ? parseInt(form.rokWydania) : undefined,
      });
      router.push("/books");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dodaj książkę</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tytuł *</label>
          <input
            type="text"
            value={form.tytul}
            onChange={(e) => setForm({ ...form, tytul: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ISBN</label>
          <input
            type="text"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rok wydania</label>
          <input
            type="number"
            value={form.rokWydania}
            onChange={(e) => setForm({ ...form, rokWydania: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Zapisywanie..." : "Zapisz"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-slate-200 px-4 py-2 rounded-md hover:bg-slate-300"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
