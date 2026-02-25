"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NEXT_PUBLIC_ENABLE_PWA !== "false"
    ) {
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
    }
  }, []);

  return null;
}

