"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require one of these roles. Omit to allow any authenticated user. */
  requiredRole?: UserRole | UserRole[];
  /** Where to send unauthenticated users (default /login). */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check authentication
      if (!isAuthenticated || !user) {
        // Only redirect if we're not already on the login page to prevent loops
        const currentPath = window.location.pathname;
        if (currentPath !== redirectTo && !currentPath.startsWith("/login")) {
          console.log("[ProtectedRoute] Not authenticated, redirecting to:", redirectTo, {
            isAuthenticated,
            hasUser: !!user,
            loading,
            currentPath,
          });
          router.replace(redirectTo);
        }
        return;
      }

      // Check role if required
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
          const currentPath = window.location.pathname;
          const target = user.role === "seller" ? "/seller/dashboard" : "/dashboard";
          if (currentPath !== target) {
            router.replace(target);
          }
          return;
        }
      }

      // Check account status
      if (user.accountStatus && user.accountStatus !== "active") {
        const currentPath = window.location.pathname;
        if (user.accountStatus === "banned" && currentPath !== "/banned") {
          router.replace("/banned");
          return;
        }
        if (user.accountStatus === "suspended" && currentPath !== "/suspended") {
          router.replace("/suspended");
          return;
        }
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (but add a small delay to prevent flash)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return null;
    }
  }

  // Check account status
  if (user.accountStatus && user.accountStatus !== "active") {
    return null;
  }

  return <>{children}</>;
}

