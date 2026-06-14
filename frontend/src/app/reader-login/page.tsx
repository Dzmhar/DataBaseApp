"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ReaderLoginPage() {
  const [login, setLogin] = useState("");
  const [haslo, setHaslo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { readerLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await readerLogin(login, haslo);
    } catch {
      setError("Nieprawidłowy login lub hasło");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">System Biblioteczny</h1>
        <p className="text-slate-500 text-center mb-6">Logowanie czytelnika</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hasło</label>
            <input
              type="password"
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            Zaloguj jako bibliotekarz
          </Link>
        </p>
      </div>
    </div>
  );
}
