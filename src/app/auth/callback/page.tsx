"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { getAuthErrorMessage } from "@/lib/auth-messages";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract query parameters
        const token = searchParams.get("token");
        const refreshToken = searchParams.get("refreshToken");
        const redirect = searchParams.get("redirect") || "/dashboard";
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        // Handle errors
        if (error) {
          console.error("OAuth error:", error);
          toast.error(getAuthErrorMessage(error));
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        // Validate success response
        if (success !== "true" || !token) {
          console.error("Invalid callback parameters", { success, token });
          toast.error(getAuthErrorMessage("invalid_callback"));
          router.push("/login?error=invalid_callback");
          return;
        }

        // Store tokens in localStorage FIRST (before API calls)
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }

          // Also set cookie for middleware compatibility
          const cookieParts = [`token=${token}`, "path=/", "SameSite=Lax"];
          if (window.location.protocol === "https:") {
            cookieParts.push("Secure");
          }
          cookieParts.push("Max-Age=604800"); // 7 days
          document.cookie = cookieParts.join("; ");

          // Verify cookie was set
          console.log("Cookie set:", document.cookie.includes("token="));
        }

        // Fetch user data from API (token is now stored, so API calls will work)
        let userData: any = null;
        let fetchFailed = false;

        try {
          // Try /api/users/me first, fallback to /api/auth/profile
          let response: any;
          try {
            console.log("Fetching user data from /api/auth/profile...");

            response = await fetch("/api/auth/profile", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const jsonData = await response.json();
            response = jsonData;
            console.log("User data response:", response);
          } catch (err: any) {
            console.error("Failed to fetch user profile:", err);
            fetchFailed = true;

            // Check if it's a network/CORS error
            const isNetworkError =
              err?.message?.includes("Failed to fetch") ||
              err?.message?.includes("NetworkError") ||
              err?.message?.includes("CORS");

            if (isNetworkError) {
              console.error("Network/CORS error detected.");
              // For network errors, we'll proceed with a basic user object
              // The AuthContext will try to fetch user data on next page load
              userData = {
                _id: "temp", // Temporary, will be updated by AuthContext
                email: "", // Will be fetched later
                role: "buyer", // Default
                phone: "", // Assume new user if we can't fetch
              };
              console.warn("Proceeding with temporary user data due to network error");
            } else {
              throw err; // Re-throw for other errors
            }
          }

          if (!fetchFailed) {
            userData = response?.data || response?.user || response;

            if (!userData || !userData._id) {
              console.error("Invalid user data received:", userData);
              throw new Error("Invalid user data received from server");
            }

            // Store user data in localStorage (matching AuthContext pattern)
            if (typeof window !== "undefined") {
              localStorage.setItem("user", JSON.stringify(userData));
              if (userData.role) {
                localStorage.setItem("role", userData.role);
              }
            }

            console.log("User data stored successfully:", {
              id: userData._id,
              email: userData.email,
              role: userData.role,
              hasPhone: !!userData.phone
            });
          }
        } catch (userError: any) {
          console.error("Failed to fetch user data:", userError);
          console.error("Error details:", {
            message: userError?.message,
            status: userError?.status,
            data: userError?.data
          });

          // Check if it's a network error
          const isNetworkError =
            userError?.message?.includes("Failed to fetch") ||
            userError?.message?.includes("NetworkError") ||
            userError?.message?.includes("CORS");

          if (isNetworkError) {
            // For network errors, show warning but proceed
            // Assume new user (no phone) so they go to role selection
            // AuthContext will try to fetch user data on next page load
            console.warn("Network error - proceeding with assumption of new user");
            userData = {
              _id: "temp",
              email: "",
              role: "buyer",
              phone: "", // No phone = new user
            };
            toast.error("Network error: Could not verify account. Please complete your profile.");
          } else {
            // For other errors, redirect to login
            toast.error(getAuthErrorMessage("failed_to_load_user"));
            router.push("/login?error=failed_to_load_user");
            return;
          }
        }

        // OAuth users may be missing phone and role (same fields we collect in email signup)
        const hasPhone = userData?.phone && String(userData.phone).trim() !== "";
        const hasRoleSelected = userData?.roleSelected === true || (userData?.role && hasPhone);

        if (!hasPhone || !hasRoleSelected) {
          toast.success("Welcome! Please complete your profile to continue.");
          router.push(`/onboarding?redirect=${encodeURIComponent(redirect)}`);
          return;
        }

        // Existing user or user with complete profile - refresh context and redirect
        try {
          await refreshUser();
          toast.success("Successfully signed in with Google!");

          // Wait a moment to ensure cookie is set and AuthContext is initialized
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (refreshError) {
          console.error("Failed to refresh user context:", refreshError);
          // Still redirect even if refresh fails, but wait a bit for cookie to be set
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Determine final redirect path based on user role and provided redirect
        const userRole = userData?.role || localStorage.getItem("role");
        let finalRedirect = redirect;

        // Clean up the redirect path
        if (finalRedirect) {
          finalRedirect = decodeURIComponent(finalRedirect);
          // Ensure it starts with / and doesn't contain external URLs
          if (!finalRedirect.startsWith("/")) finalRedirect = "/" + finalRedirect;
          // Strip out any redundant /auth prefixes
          if (finalRedirect.startsWith("/auth/")) {
            finalRedirect = finalRedirect.replace("/auth/", "/");
          }
        }

        if (!finalRedirect || finalRedirect === "/" || finalRedirect === "/dashboard" || finalRedirect === "/seller/dashboard") {
          finalRedirect = userRole === "seller" ? "/seller/dashboard" : "/dashboard";
        }

        // Redirect to desired page
        router.push(finalRedirect);
      } catch (error: any) {
        console.error("Callback error:", error);
        toast.error(getAuthErrorMessage("callback_error"));
        router.push("/login?error=callback_error");
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}

