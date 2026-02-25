"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export const dynamic = 'force-dynamic';

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const source = searchParams.get("source");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      try {
        // Check if tokens are in URL (from OAuth callback)
        const tokenFromUrl = searchParams.get("token");
        const refreshTokenFromUrl = searchParams.get("refreshToken");

        let token = tokenFromUrl;
        let refreshToken = refreshTokenFromUrl;
        let userData = null;

        if (token) {
          // Tokens provided in URL, fetch user data from internal API
          const response = await api("/api/auth/profile", {
            auth: token,
          });
          userData = response?.data || response?.user || response;
        } else {
          // Try to fetch with stored token
          const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (storedToken) {
            const response = await api("/api/auth/profile", {
              auth: storedToken,
            });
            userData = response?.data || response?.user || response;
            token = storedToken;
          } else {
            throw new Error("No authentication token found. Please try logging in again.");
          }
        }
        
        if (userData && userData._id) {
          // Store tokens and user data in localStorage
          if (typeof window !== "undefined") {
            if (token) {
              localStorage.setItem("token", token);
            }
            if (refreshToken) {
              localStorage.setItem("refreshToken", refreshToken);
            }
            localStorage.setItem("user", JSON.stringify(userData));
            if (userData.role) {
              localStorage.setItem("role", userData.role);
            }
          }

          // Refresh auth context
          await refreshUser();

          // Check if user needs to select role
          // Show role selection for new OAuth users:
          // 1. Check if user was just created (within last 5 minutes) - OAuth creates new users
          // 2. Check if user has default "buyer" role and no shop (indicating new OAuth signup)
          // 3. Check if user doesn't have phone number (OAuth users might not have phone initially)
          const userCreatedAt = userData.createdAt ? new Date(userData.createdAt).getTime() : null;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const isRecentlyCreated = userCreatedAt && userCreatedAt > fiveMinutesAgo;
          const hasDefaultRole = !userData.role || userData.role === "buyer";
          const noShop = !userData.shop;
          const noPhone = !userData.phone || userData.phone.trim() === "";
          
          // Show role selection if user appears to be new from OAuth
          const needsRoleSelection = isRecentlyCreated && hasDefaultRole && noShop;

          if (needsRoleSelection) {
            // Redirect to role selection page
            setStatus("success");
            setMessage("Setting up your account...");
            setTimeout(() => {
              const redirect = searchParams.get("redirect");
              router.push(`/auth/select-role${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`);
            }, 1000);
          } else {
            // Existing user or role already set, go to dashboard
            setStatus("success");
            setMessage(`Successfully signed in with ${source || "Google"}! Redirecting...`);

            // Redirect to dashboard or home
            setTimeout(() => {
              const redirect = searchParams.get("redirect") || "/dashboard";
              router.push(redirect);
            }, 1500);
          }
        } else {
          throw new Error("Failed to get user data");
        }
      } catch (error: any) {
        console.error("OAuth success error:", error);
        setStatus("error");
        setMessage(error.message || "Authentication failed. Please try again.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleOAuthSuccess();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-emerald-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-red-600 mb-4">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthSuccessContent />
    </Suspense>
  );
}

