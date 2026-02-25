"use client";

import { ErrorBoundary } from "./ErrorBoundary";
import { AuthProvider } from "@/modules/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}

