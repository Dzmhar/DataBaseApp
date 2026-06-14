"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "./AppLayout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
