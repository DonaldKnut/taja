"use client";

import { ErrorBoundary } from "./ErrorBoundary";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "@/modules/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

