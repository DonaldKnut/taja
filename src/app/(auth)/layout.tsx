import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taja.Shop - Auth",
  description: "Sign in or create your Taja.Shop account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a segment layout for the (auth) route group.
  // The root document structure (<html>, <head>, <body>) is owned
  // by src/app/layout.tsx. Here we only wrap the auth pages.
  return (
    <div className="min-h-screen bg-gradient-to-br from-taja-light to-white">
      {children}
    </div>
  );
}


