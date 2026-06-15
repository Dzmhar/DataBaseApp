"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const librarianNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/books", label: "Książki" },
  { href: "/authors", label: "Autorzy" },
  { href: "/readers", label: "Czytelnicy" },
  { href: "/copies", label: "Egzemplarze" },
  { href: "/borrowings", label: "Wypożyczenia" },
  { href: "/history", label: "Historia" },
  { href: "/reservations", label: "Rezerwacje" },
];

const readerNavItems = [
  { href: "/reader/dashboard", label: "Dashboard" },
  { href: "/reader/active-borrowings", label: "Aktywne wypożyczenia" },
  { href: "/reader/books", label: "Książki" },
  { href: "/reader/reservations", label: "Moje rezerwacje" },
  { href: "/reader/history", label: "Moje wypożyczenia" },
  { href: "/reader/profile", label: "Mój profil" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = user?.role === "librarian" ? librarianNavItems : readerNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold">Biblioteka</h1>
        <p className="text-sm text-slate-400">System zarządzania</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">
          {user?.Imie} {user?.Nazwisko}
          <span className="ml-2 text-xs text-slate-500">
            ({user?.role === "librarian" ? "bibliotekarz" : "czytelnik"})
          </span>
        </p>
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:text-red-300 mt-1"
        >
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
