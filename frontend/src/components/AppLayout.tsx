"use client";

import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const isReaderLoginPage = pathname === "/reader-login";

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage && !isReaderLoginPage) {
      router.push("/reader-login");
    }
    if (!isLoading && user) {
      if (isLoginPage || isReaderLoginPage) {
        if (user.role === "librarian") router.push("/dashboard");
        else router.push("/reader/dashboard");
      }
    }
  }, [user, isLoading, isLoginPage, isReaderLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-lg">Ładowanie...</p>
      </div>
    );
  }

  if (isLoginPage || isReaderLoginPage) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
