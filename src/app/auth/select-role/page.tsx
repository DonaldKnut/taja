"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Store, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { normalizeNigerianPhone, isValidNigerianPhone } from "@/lib/utils";
import type { UserRole } from "@/types";

export const dynamic = 'force-dynamic';

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; role?: string }>({});

  const handleRoleSelect = async () => {
    // Validate role
    if (!selectedRole) {
      setErrors({ role: "Please select a role" });
      toast.error("Please select a role");
      return;
    }

    // Validate phone number
    if (!phone || phone.trim() === "") {
      setErrors({ phone: "Phone number is required" });
      toast.error("Please enter your phone number");
      return;
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = normalizeNigerianPhone(phone);
    
    if (!isValidNigerianPhone(phone)) {
      setErrors({ phone: "Please enter a valid Nigerian phone number" });
      toast.error("Please enter a valid Nigerian phone number (e.g., +234 801 234 5678 or 08012345678)");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      // Update user role and phone number via API
      // Use normalized phone (without spaces) for storage
      const normalizedPhone = normalizeNigerianPhone(phone);
      const updateData: { role: UserRole; phone: string } = {
        role: selectedRole,
        phone: normalizedPhone,
      };

      const response = await api("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      // Update localStorage
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.role = selectedRole;
          user.phone = normalizedPhone;
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", selectedRole);
        }
      }

      // Refresh auth context
      await refreshUser();

      toast.success(`Welcome as a ${selectedRole === "seller" ? "seller" : "buyer"}!`);

      // Redirect based on role
      const redirect = searchParams.get("redirect") || (selectedRole === "seller" ? "/seller/setup" : "/dashboard");
      router.push(redirect);
    } catch (error: any) {
      console.error("Role selection error:", error);
      toast.error(error?.message || "Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Path</h1>
          <p className="text-gray-600">Tell us how you'd like to use Taja.Shop</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Buyer Card */}
          <button
            onClick={() => setSelectedRole("buyer")}
            className={`p-8 rounded-2xl border-2 transition-all text-left ${
              selectedRole === "buyer"
                ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-4 rounded-xl ${
                  selectedRole === "buyer" ? "bg-emerald-500" : "bg-emerald-100"
                }`}
              >
                <ShoppingBag
                  className={`h-8 w-8 ${
                    selectedRole === "buyer" ? "text-white" : "text-emerald-600"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">I'm a Buyer</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Browse and purchase products from amazing sellers
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    Shop from verified sellers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    Secure escrow payments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    Track your orders
                  </li>
                </ul>
              </div>
              {selectedRole === "buyer" && (
                <div className="text-emerald-500">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Seller Card */}
          <button
            onClick={() => setSelectedRole("seller")}
            className={`p-8 rounded-2xl border-2 transition-all text-left ${
              selectedRole === "seller"
                ? "border-amber-500 bg-amber-50 shadow-lg scale-105"
                : "border-gray-200 bg-white hover:border-amber-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-4 rounded-xl ${
                  selectedRole === "seller" ? "bg-amber-500" : "bg-amber-100"
                }`}
              >
                <Store
                  className={`h-8 w-8 ${
                    selectedRole === "seller" ? "text-white" : "text-amber-600"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">I'm a Seller</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create your shop and start selling to buyers
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    Create your own shop
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    Reach thousands of buyers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    Secure payment processing
                  </li>
                </ul>
              </div>
              {selectedRole === "seller" && (
                <div className="text-amber-500">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Phone Number Field */}
        <div className="mb-6">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              className="pl-10"
              placeholder="+234 801 234 5678"
              disabled={loading}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter your Nigerian phone number (required for account verification)
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleRoleSelect}
          disabled={!selectedRole || !phone || loading}
          className="w-full py-6 text-lg font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Setting up...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          You can change your role and phone number later in settings
        </p>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}









