"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";
import type { User, UserRole, LoginResponse, ApiResponse, RegisterResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Logout function - defined early since it's used by refreshUser
  const logout = useCallback(async () => {
    try {
      // Clear all localStorage items
      if (typeof window !== "undefined") {
        // Clear auth-related items
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("rememberMe");

        // Clear cart storage (Zustand persist)
        localStorage.removeItem("taja-cart-storage");

        // Clear any other potential auth-related items
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith("auth-") ||
            key.startsWith("user-") ||
            key.startsWith("token-") ||
            key.includes("session") ||
            key.includes("auth")
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear all cookies (not just token)
        // More efficient: clear cookies with proper attributes
        const cookies = document.cookie.split(";");
        const domain = window.location.hostname;
        const isSecure = window.location.protocol === "https:";

        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (!name) return;

          // Clear cookie with all possible combinations
          const baseExpiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
          const paths = ["/", window.location.pathname];
          const domains = [domain, `.${domain}`];

          paths.forEach(path => {
            domains.forEach(dom => {
              document.cookie = `${name}=;${baseExpiry};path=${path};domain=${dom}`;
              document.cookie = `${name}=;${baseExpiry};path=${path};domain=${dom};SameSite=Lax`;
              if (isSecure) {
                document.cookie = `${name}=;${baseExpiry};path=${path};domain=${dom};SameSite=Lax;Secure`;
              }
            });
          });
        });

        // Try to call logout API endpoint to invalidate tokens on server
        // This is fire-and-forget - don't wait for it
        const token = localStorage.getItem("token"); // Get before clearing
        const refreshToken = localStorage.getItem("refreshToken"); // Get before clearing
        if (token) {
          fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
            },
            body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
            // Don't wait for response
          }).catch(() => {
            // Ignore errors - logout should work even if API call fails
          });
        }
      }

      // Clear user state
      setUser(null);

      // Clear cart store if available
      try {
        const { useCartStore } = await import("@/stores/cartStore");
        useCartStore.getState().clearCart();
      } catch (error) {
        // Cart store might not be available, ignore
      }

      // Clear user state first
      setUser(null);

      // Show success message
      toast.success("Logged out successfully");

      // Redirect to home page and force reload to clear all cached state
      // Using window.location ensures complete cleanup (clears React state, cache, etc.)
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear what we can and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      setUser(null);
      router.replace("/");
    }
  }, [router]);

  // Refresh user data from API - defined early since it's used in useEffect
  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setUser(null);
        return;
      }

      // Try /api/users/me first, fallback to /api/auth/profile
      let response: ApiResponse<User> | any;
      try {
        response = await api("/api/users/me");
      } catch (error) {
        try {
          response = await api("/api/auth/profile");
        } catch (err) {
          throw error; // Use original error
        }
      }

      const userData = response?.data || (response as any)?.user;
      if (userData) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
          if (userData.role) {
            localStorage.setItem("role", userData.role);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to refresh user:", error);
      // If token is invalid, clear auth state
      if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        logout();
      }
    }
  }, [logout]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;

        if (token) {
          // If we have a token, try to load user data from cache first (for faster initial render)
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              setUser(userData);
              // Set loading to false immediately so UI can render
              setLoading(false);
            } catch (error) {
              console.error("Failed to parse user data:", error);
              // Clear invalid user data but keep token
              if (typeof window !== "undefined") {
                localStorage.removeItem("user");
              }
            }
          }

          // Then try to refresh user data from API in the background to verify token is valid
          // This will update the user state if successful, but won't block the UI
          refreshUser().catch((error: any) => {
            console.error("Failed to refresh user on init:", error);
            // If refresh fails (especially 401), clear everything immediately
            if (
              error?.status === 401 ||
              error?.message?.includes("401") ||
              error?.message?.includes("Unauthorized")
            ) {
              if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("role");
              }
              setUser(null);
            }
            // For other errors (network, timeout), keep cached user
          });
        } else {
          // No token, clear everything
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  // Login function
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const response = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      }) as any;

      const token = response?.data?.token || response?.token;
      const userData = response?.data?.user || response?.data || (response as LoginResponse)?.user;

      if (token && userData) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          if (userData.role) {
            localStorage.setItem("role", userData.role);
          }
          if (response?.data?.refreshToken || response?.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              response.data?.refreshToken || response.refreshToken!
            );
          }

          // Server-side login API now sets the 'token' cookie automatically.
          // Client-side manual cookie setting removed to avoid duplication and potential mismatches.
        }
        setUser(userData);
        toast.success(response?.message || "Login successful!");
      } else {
        throw new Error("No token or user data received");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "Login failed. Please check your credentials.");
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }) as RegisterResponse;

      if (response?.success) {
        toast.success(response?.message || "Registration successful! Please verify your email.");
      } else {
        throw new Error(response?.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error?.message || "Registration failed. Please try again.");
      throw error;
    }
  }, []);

  // Update user function
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    if (typeof window !== "undefined" && user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  }, [user]);

  // Verify email function
  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      const response = await api("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });

      if (response?.success) {
        toast.success(response?.message || "Email verified successfully!");
        // Refresh user data to get updated verification status
        await refreshUser();
      } else {
        throw new Error(response?.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast.error(error?.message || "Failed to verify email. Please try again.");
      throw error;
    }
  }, [refreshUser]);

  // Resend verification code function
  const resendVerification = useCallback(async (email: string) => {
    try {
      const response = await api("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (response?.success) {
        toast.success(response?.message || "Verification code sent to your email!");
      } else {
        throw new Error(response?.message || "Failed to resend verification code");
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast.error(error?.message || "Failed to resend verification code. Please try again.");
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    verifyEmail,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

