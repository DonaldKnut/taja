"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === "false") return;
    if (process.env.NODE_ENV !== "production") return;

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }, []);

  return null;
}

