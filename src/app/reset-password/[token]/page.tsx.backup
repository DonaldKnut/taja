"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { z } from "zod";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const passwordSchema = z
    .object({
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const isFormValid = passwordSchema.safeParse(formData).success;

  useEffect(() => {
    // Verify token on component mount
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `/api/auth/verify-reset-token/${params.token}`
      );
      const data = await response.json();

      if (response.ok) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error("Invalid or expired reset token");
      }
    } catch (error) {
      setTokenValid(false);
      toast.error("Error verifying reset token");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    const parsed = passwordSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as "password" | "confirmPassword";
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the errors");
      setLoading(false);
      return;
    }
    setErrors({});

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: params.token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordReset(true);
        toast.success("Password reset successfully!");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name as "password" | "confirmPassword"]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  if (tokenValid === null) {
    return (
      <div className="h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-screen">
          <div className="bg-white p-6 sm:p-10 h-full overflow-y-auto flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 sm:p-10 text-gray-100 hidden md:block md:sticky md:top-0 md:h-screen">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%)]" />
            <div className="relative h-full flex flex-col justify-center space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-screen">
          <div className="bg-white p-6 sm:p-10 h-full overflow-y-auto">
            <div className="max-w-md w-full h-full flex flex-col justify-center space-y-8 text-center mx-auto px-4 sm:px-0">
              <div>
                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                  Invalid Reset Link
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Request New Reset Link
              </Button>
          <div className="text-center">
            <Link
              href="/"
              className="mt-3 inline-block text-sm text-emerald-600 hover:text-emerald-500"
            >
              Back to Home
            </Link>
          </div>
            </div>
          </div>
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 sm:p-10 text-gray-100 hidden md:block md:sticky md:top-0 md:h-screen">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%)]" />
          <div className="relative h-full flex flex-col justify-center space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-screen">
          <div className="bg-white p-6 sm:p-10 h-full overflow-y-auto">
            <div className="max-w-md w-full h-full flex flex-col justify-center space-y-8 text-center mx-auto px-4 sm:px-0">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                  Password Reset Successfully
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been updated. You can now sign in with your new
                  password.
                </p>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Sign In
              </Button>
          <div className="text-center">
            <Link
              href="/"
              className="mt-3 inline-block text-sm text-emerald-600 hover:text-emerald-500"
            >
              Back to Home
            </Link>
          </div>
            </div>
          </div>
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 sm:p-10 text-gray-100 hidden md:block md:sticky md:top-0 md:h-screen">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%)]" />
          <div className="relative h-full flex flex-col justify-center space-y-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full w-screen">
        <div className="bg-white p-6 sm:p-10 h-full overflow-y-auto">
          <div className="max-w-md w-full mx-auto h-full flex flex-col justify-center space-y-8 px-4 sm:px-0">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Reset Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => {
                    const pwdBase: any = (passwordSchema as any)._def?.schema ?? passwordSchema;
                    const single = z.object({ password: (pwdBase.shape as any).password as any });
                    const parsed = single.safeParse({ password: formData.password });
                    if (!parsed.success) {
                      setErrors({ ...errors, password: parsed.error.issues[0]?.message });
                    }
                  }}
                  className="pl-10 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number,
                and special character
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => {
                    const parsed = passwordSchema.safeParse(formData);
                    if (!parsed.success) {
                      const issue = parsed.error.issues.find((i) => i.path[0] === "confirmPassword");
                      if (issue) setErrors({ ...errors, confirmPassword: issue.message });
                    }
                  }}
                  className="pl-10 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                Reset Password
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        <div className="text-center">
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-emerald-600 hover:text-emerald-500"
          >
            Back to Home
          </Link>
        </div>
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 sm:p-10 text-gray-100 hidden md:block md:sticky md:top-0 md:h-screen">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%)]" />
          <div className="relative h-full flex flex-col justify-center space-y-4">
            <a className="group flex items-start justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition" href="#">
              <div className="flex items-start">
                <div className="mr-3 rounded-lg bg-white/10 p-2" />
                <div>
                  <p className="text-sm font-semibold">Keep your account secure</p>
                  <p className="text-xs text-gray-300">Use a strong password</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

