"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Truck } from "lucide-react";

function LogisticsLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/logistics/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Sign-in failed");
      }
      const token = json?.data?.token;
      const user = json?.data?.user;
      if (token && user && typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        if (json.data.refreshToken) {
          localStorage.setItem("refreshToken", json.data.refreshToken);
        }
      }
      toast.success("Welcome back");
      const next = searchParams.get("redirect");
      const dest = next && next.startsWith("/logistics") ? next : "/logistics/dashboard";
      window.location.assign(dest);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen motif-blanc flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-xl p-8 sm:p-10">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Truck className="h-6 w-6" />
          </div>
          <Logo size="md" href="/" variant="header" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Rider sign-in</h1>
          <p className="text-center text-sm font-semibold text-slate-500">
            Logistics portal only — not for buyer or seller accounts.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="rider-email">Email</Label>
            <Input
              id="rider-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 rounded-xl"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="rider-password">Password</Label>
            <Input
              id="rider-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300"
            />
            Stay signed in
          </label>
          <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center">
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Forgot password?
            </Link>
            <span className="text-xs font-semibold text-slate-400"> — same reset flow as other accounts; use your rider email.</span>
          </p>
        </form>

        <p className="mt-8 text-center text-xs font-semibold text-slate-500">
          Need access? Complete{" "}
          <Link href="/logistics/apply" className="text-emerald-700 font-bold hover:underline">
            rider application
          </Link>
          . After approval, an admin issues your rider login.
        </p>
        <p className="mt-4 text-center text-xs font-semibold text-slate-400">
          Buyer or seller?{" "}
          <Link href="/login" className="text-slate-700 font-bold hover:underline">
            Main sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LogisticsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">
          Loading…
        </div>
      }
    >
      <LogisticsLoginForm />
    </Suspense>
  );
}
