"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Truck,
  Users,
  Star,
  ArrowRight,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { BrandShowcase } from "@/components/ui/BrandShowcase";
import { AdvancedFooter } from "@/components/ui/AdvancedFooter";
import { Logo } from "@/components/ui/Logo";
import { DashboardPreview } from "@/components/ui/DashboardPreview";
import { HomepageRecommendations } from "@/components/homepage/HomepageRecommendations";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/layout";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { CorporateRegistry } from "@/components/homepage/CorporateRegistry";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  // Handle scroll to change nav background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="min-h-screen">
        {/* Navigation - Enhanced */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-taja-primary/5 shadow-premium py-2"
          : "bg-transparent py-4"
          }`}>
          <div className="absolute inset-0 motif-blanc opacity-20 pointer-events-none"></div>
          {/* Hero-matching background elements - only when not scrolled */}
          {!isScrolled && (
            <>
              {/* Motif Gris Pattern */}
              <div className="absolute inset-0 motif-gris-subtle opacity-30 pointer-events-none"></div>

              {/* Gradient Overlays - matching hero */}
              <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-100/40 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-1/2 h-2/3 bg-gradient-to-tl from-gray-100/30 via-transparent to-transparent pointer-events-none"></div>
            </>
          )}
          <Container size="lg" className="relative z-10">
            <div className="flex justify-between items-center h-16">
              <Logo size="lg" variant="header" />
              <div className="hidden md:flex items-center space-x-10">
                <Link
                  href="/marketplace"
                  className="text-sm font-bold text-taja-secondary hover:text-taja-primary transition-colors tracking-tight"
                >
                  Marketplace
                </Link>
                <Link
                  href="/blog"
                  className="text-sm font-bold text-taja-secondary hover:text-taja-primary transition-colors tracking-tight"
                >
                  Journal
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-sm font-bold text-taja-secondary hover:text-taja-primary transition-colors tracking-tight"
                >
                  How it Works
                </Link>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-6">
                    <div className="h-8 w-px bg-taja-primary/10 mx-2" />
                    <Link
                      href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                      className="group transition-all flex items-center gap-2 text-sm font-bold text-taja-secondary hover:text-taja-primary"
                    >
                      <div className="h-8 w-8 rounded-full bg-taja-light flex items-center justify-center group-hover:bg-taja-primary group-hover:text-white transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/login"
                      className="text-sm font-bold text-taja-secondary hover:text-taja-primary transition-colors px-4"
                    >
                      Login
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push("/register")}
                      className="rounded-full px-6"
                    >
                      Start Selling
                    </Button>
                  </div>
                )}
              </div>
              <button
                className="md:hidden p-2 rounded-xl bg-taja-light text-taja-primary active:scale-90 transition-all"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </Container>
        </nav>

        {/* Mobile Menu - Premium Redesign */}
        <div
          className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
        >
          {/* Backdrop - Ultra Blur */}
          <div
            className={`absolute inset-0 bg-taja-secondary/20 backdrop-blur-sm transition-opacity duration-500 ${mobileOpen ? "opacity-100" : "opacity-0"
              }`}
            onClick={() => setMobileOpen(false)}
          />

          {/* Menu Panel - Glassmorphism Slide */}
          <div
            className={`absolute top-0 right-0 h-full w-[85%] max-w-[320px] bg-white/90 backdrop-blur-2xl border-l border-white/20 shadow-2xl flex flex-col transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            {/* Header / User Profile */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-taja-light flex items-center justify-center text-taja-primary font-bold">
                    {user.fullName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-taja-secondary tracking-tight">{user.fullName || "User"}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Welcome Back</p>
                  </div>
                </div>
              ) : (
                <Logo size="md" />
              )}
              <button
                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 text-taja-secondary hover:bg-taja-light hover:text-taja-primary transition-all active:scale-90"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Navigation</span>
                <Link
                  href="/marketplace"
                  className="group flex items-center justify-between text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Marketplace
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
                <Link
                  href="/blog"
                  className="group flex items-center justify-between text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Journal
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="group flex items-center justify-between text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  How it Works
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              </div>

              {isAuthenticated && user ? (
                <div className="space-y-2 pt-6 border-t border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Dashboard</span>
                  <Link
                    href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                    className="flex items-center gap-3 text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 opacity-50" />
                    Dashboard
                  </Link>
                  <Link
                    href={user?.role === "seller" ? "/seller/profile" : "/dashboard/profile"}
                    className="flex items-center gap-3 text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-5 w-5 opacity-50" />
                    Profile
                  </Link>
                  {user.role === "seller" && (
                    <Link
                      href="/seller"
                      className="flex items-center gap-3 text-lg font-bold text-taja-secondary hover:text-taja-primary transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Shield className="h-5 w-5 opacity-50" />
                      My Shop
                    </Link>
                  )}
                </div>
              ) : (
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <Button
                    onClick={() => { router.push("/register"); setMobileOpen(false); }}
                    className="w-full rounded-full"
                  >
                    Start Selling Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { router.push("/login"); setMobileOpen(false); }}
                    className="w-full rounded-full"
                  >
                    Login to Account
                  </Button>
                </div>
              )}
            </nav>

            {isAuthenticated && (
              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-sm font-bold text-red-500 hover:text-red-700 transition-all w-full"
                >
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  Log Out Securely
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero Section - World-Class Design */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 motif-blanc opacity-40"></div>
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-taja-primary/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-taja-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <Container size="lg" className="relative z-10 py-32">
            <div className="flex flex-col lg:flex-row lg:items-center gap-20">
              {/* Left Side: Content */}
              <div className="lg:flex-[0.9] text-center lg:text-left space-y-10">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-taja-light/50 border border-taja-primary/10 backdrop-blur-md animate-fade-in ring-1 ring-taja-primary/5">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-taja-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-taja-primary"></span>
                  </div>
                  <span className="text-[11px] font-extrabold text-taja-primary uppercase tracking-[0.2em]">World-Class Digital Commerce</span>
                </div>

                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-taja-secondary tracking-tighter leading-[0.9] !mt-4 transition-all">
                  The New <br />
                  <span className="text-transparent bg-clip-text bg-gradient-taja">Standard </span>
                  of Selling.
                </h1>

                <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Taja is the marketplace to buy anything and sell anything online — built for Nigerian and African sellers
                  and entrepreneurs. Get a storefront, trusted checkout, and tools that replace chaotic DMs.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center pt-4">
                  <Button
                    onClick={() => router.push("/register")}
                    size="lg"
                    className="rounded-full px-10 shadow-premium hover:shadow-premium-hover min-w-[200px]"
                  >
                    Create Your Shop
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push("/marketplace")}
                    className="rounded-full px-10 min-w-[200px]"
                  >
                    Explore Items
                  </Button>
                </div>

                {/* Trust Indicators - Integrated */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-[11px] font-bold uppercase tracking-widest text-taja-primary/60 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure Escrow Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Nationwide Delivery</span>
                  </div>
                </div>

                <div className="pt-10 flex flex-wrap items-center justify-center lg:justify-start gap-10">
                  <div className="flex flex-col items-center lg:items-start gap-1">
                    <span className="text-2xl font-black text-taja-secondary">Curated</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center lg:text-left">Premium Shops</span>
                  </div>
                  <div className="h-10 w-px bg-gray-100 hidden sm:block" />
                  <div className="flex flex-col items-center lg:items-start gap-1">
                    <span className="text-2xl font-black text-taja-secondary">₦1.5M+</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center lg:text-left">Verified Transactions</span>
                  </div>
                  <div className="h-10 w-px bg-gray-100 hidden sm:block" />
                  <div className="flex flex-col items-center lg:items-start gap-1">
                    <span className="text-2xl font-black text-taja-secondary">100%</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center lg:text-left">Escrow Protection</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Preview - Enhanced Space */}
              <div className="lg:flex-[1.1] lg:flex-shrink-0 hidden lg:block">
                <DashboardPreview />
              </div>
            </div>
          </Container>
        </section>

        {/* Newsletter Section - Premium Sign-up */}
        <NewsletterSection />

        {/* AI-Powered Recommendations */}
        <HomepageRecommendations />

        {/* Brand Showcase Section */}
        <BrandShowcase />

        {/* CTA Section - Enhanced */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-white">
          {/* Background Elements */}
          <div className="absolute inset-0 motif-blanc opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-taja-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

          <Container size="md" className="relative z-10 text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-light/30 border border-taja-primary/10">
              <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Ready to Scale?</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter leading-tight max-w-2xl mx-auto">
              Build your <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Dream Shop</span> today.
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Join thousands of Nigerian entrepreneurs selling thrift fashion, vintage items, and handmade crafts.
              Build your brand with professional tools.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/register")}
                size="lg"
                className="rounded-full px-12"
              >
                Get Started Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/marketplace")}
                className="rounded-full px-12"
              >
                Browse Shop
              </Button>
            </div>
          </Container>
        </section>

        {/* Corporate Trust & Registry Section */}
        <CorporateRegistry />

        {/* Advanced Footer */}
        <AdvancedFooter />
      </div>
    </>
  );
}
