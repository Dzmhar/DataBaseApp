"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ReaderProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    nazwisko: "",
    imie: "",
    email: "",
    telefon: "",
    login: "",
    haslo: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user && user.role === "reader") {
      setForm({
        nazwisko: user.Nazwisko,
        imie: user.Imie,
        email: user.Email || "",
        telefon: user.Telefon || "",
        login: user.Login,
        haslo: "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const result = await api.updateMyProfile({
        nazwisko: form.nazwisko,
        imie: form.imie,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        login: form.login,
        haslo: form.haslo || undefined,
      });
      updateUser({ ...result, role: "reader" });
      setMessage("Dane zostały zaktualizowane.");
    } catch (err: any) {
      setMessage(err.message || "Błąd podczas zapisu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mój profil</h1>

      {message && (
        <p
          className={`text-sm mb-4 p-3 rounded ${
            message === "Dane zostały zaktualizowane."
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nazwisko</label>
          <input
            name="nazwisko"
            value={form.nazwisko}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Imię</label>
          <input
            name="imie"
            value={form.imie}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
          <input
            name="telefon"
            value={form.telefon}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
          <input
            name="login"
            value={form.login}
            onChange={handleChange}
            required
            minLength={3}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nowe hasło <span className="text-slate-400 font-normal">(pozostaw puste, aby nie zmieniać)</span>
          </label>
          <input
            name="haslo"
            type="password"
            value={form.haslo}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Zapisywanie..." : "Zapisz"}
        </button>
      </form>
    </div>
  );
}
