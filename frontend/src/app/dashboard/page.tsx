"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "librarian")) {
      router.push("/login");
      return;
    }
    api.dashboard().then(setData).catch((err) => setError(err.message));
  }, [user, isLoading, router]);

  if (error) return <p className="text-red-600">{error}</p>;

  if (!data) return <p>Ładowanie...</p>;

  const cards = [
    { label: "Książki", value: data.books, color: "bg-blue-500" },
    { label: "Czytelnicy", value: data.readers, color: "bg-green-500" },
    { label: "Dostępne egzemplarze", value: data.available_copies, color: "bg-teal-500" },
    { label: "Aktywne wypożyczenia", value: data.active_borrowings, color: "bg-amber-500" },
    { label: "Aktywne rezerwacje", value: data.active_reservations, color: "bg-purple-500" },
    { label: "Po terminie", value: data.overdue, color: "bg-red-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className={`w-3 h-3 rounded-full ${card.color} mb-2`} />
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-slate-500 text-sm">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
