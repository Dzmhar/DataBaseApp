"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

interface Librarian {
  IdB: number;
  Nazwisko: string;
  Imie: string;
  Login: string;
  role: "librarian";
}

interface Reader {
  IdC: number;
  Nazwisko: string;
  Imie: string;
  Login: string;
  role: "reader";
}

type User = Librarian | Reader;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (login: string, haslo: string) => Promise<void>;
  readerLogin: (login: string, haslo: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (login: string, haslo: string) => {
    const res = await api.login(login, haslo);
    const userData = { ...res.bibliotekarz, role: "librarian" as const };
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(res.access_token);
    setUser(userData);
  };

  const readerLogin = async (login: string, haslo: string) => {
    const res = await api.readerLogin(login, haslo);
    const userData = { ...res.czytelnik, role: "reader" as const };
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(res.access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, readerLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
