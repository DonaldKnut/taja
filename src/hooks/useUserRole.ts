"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Role = "buyer" | "seller" | "admin";

export function useUserRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRole() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          // No token, fallback to localStorage
          const userRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          const roleFromUser = userRaw ? (JSON.parse(userRaw)?.role as string | undefined) : undefined;
          const roleFromStorage = typeof window !== "undefined" ? (localStorage.getItem("role") as string | null) : null;
          if (isMounted) setRole(((roleFromUser || roleFromStorage) as Role) || "buyer");
          if (isMounted) setLoading(false);
          return;
        }

        // Try /api/users/me first (from userRoutes)
        try {
          console.log("👤 Fetching user role from /api/users/me");
          const data = await api("/api/users/me", {
            method: "GET",
          });
          console.log("👤 User role response:", data);
          if (isMounted && data?.user?.role) {
            setRole(data.user.role as Role);
            if (isMounted) setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("⚠️ /api/users/me failed, trying /api/auth/profile:", err);
          // If /api/users/me fails, try /api/auth/profile
          try {
            console.log("👤 Fetching user role from /api/auth/profile");
            const data = await api("/api/auth/profile", {
              method: "GET",
            });
            console.log("👤 User role response:", data);
            if (isMounted && data?.data?.role) {
              setRole(data.data.role as Role);
              if (isMounted) setLoading(false);
              return;
            }
          } catch (err2) {
            console.warn("⚠️ /api/auth/profile also failed:", err2);
            // Both endpoints failed, fallback to localStorage
            const userRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const roleFromUser = userRaw ? (JSON.parse(userRaw)?.role as string | undefined) : undefined;
            const roleFromStorage = typeof window !== "undefined" ? (localStorage.getItem("role") as string | null) : null;
            if (isMounted) setRole(((roleFromUser || roleFromStorage) as Role) || "buyer");
          }
        }
      } catch {
        // Fallback to localStorage if all else fails
        const userRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        const roleFromUser = userRaw ? (JSON.parse(userRaw)?.role as string | undefined) : undefined;
        const roleFromStorage = typeof window !== "undefined" ? (localStorage.getItem("role") as string | null) : null;
        if (isMounted) setRole(((roleFromUser || roleFromStorage) as Role) || "buyer");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  return { role, loading } as const;
}






