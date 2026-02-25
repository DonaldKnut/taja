"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Store,
  ShoppingCart,
  Shield,
  Truck,
  CreditCard,
  MessageCircle,
  Users,
  TrendingUp,
  Zap,
  Target,
  Star,
  Heart,
  Rocket,
  Sparkles,
  BarChart3,
  Globe,
  Smartphone,
  Award,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AdvancedFooter } from "@/components/ui/AdvancedFooter";
import { useAuth } from "@/contexts/AuthContext";
import { Container, Section } from "@/components/layout";

export default function HowItWorksPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"seller" | "buyer">("seller");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

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

  const sellerSteps = [
    {
      number: "01",
      title: "Create Your Account",
      description:
        "Sign up in minutes with your email or phone number. Verify your identity and join our elite network.",
      icon: Store,
    },
    {
      number: "02",
      title: "Set Up Your Shop",
      description:
        "Customize your digital storefront with premium branding. Make an impact from the first click.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "List Your Products",
      description:
        "Upload high-resolution media and craft detailed descriptions to showcase your unique items.",
      icon: ShoppingCart,
    },
    {
      number: "04",
      title: "Manage Orders",
      description:
        "Receive instant notifications and process orders through our secure, high-tech dashboard.",
      icon: Truck,
    },
    {
      number: "05",
      title: "Scale Your Brand",
      description:
        "Leverage professional analytics and marketing tools to dominate the marketplace.",
      icon: TrendingUp,
    },
  ];

  const buyerSteps = [
    {
      number: "01",
      title: "Discover Excellence",
      description:
        "Explore curated collections across fashion, technology, and more from verified partners.",
      icon: Globe,
    },
    {
      number: "02",
      title: "Search & Refine",
      description:
        "Find exactly what you need with our high-speed filtering and search infrastructure.",
      icon: Target,
    },
    {
      number: "03",
      title: "Trusted Selection",
      description:
        "Shop with confidence through detailed ratings and transparent seller credibility.",
      icon: Star,
    },
    {
      number: "04",
      title: "Emerald Security",
      description:
        "Experience the peace of mind that comes with our clinical escrow and verification protocols.",
      icon: Shield,
    },
    {
      number: "05",
      title: "Premium Delivery",
      description:
        "Receive your items through our coordinated logistics network with real-time tracking.",
      icon: Smartphone,
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Escrow",
      description:
        "Clinical transaction protection with advanced encryption for every partner.",
    },
    {
      icon: Truck,
      title: "Express Logistics",
      description:
        "Integrated delivery network covering Nigeria with precision and speed.",
    },
    {
      icon: Zap,
      title: "Neural Search",
      description:
        "High-performance discovery engine for finding pre-loved and vintage gems instantly.",
    },
    {
      icon: Award,
      title: "Verified Elite",
      description:
        "Rigorous seller verification ensuring only the highest quality products.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Data-driven insights to help you understand your market and grow your business.",
    },
  ];

  return (
    <div className="min-h-screen bg-motif-blanc relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-taja-light/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-taja-light/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="glass-panel border-b border-white/60 sticky top-0 z-50 backdrop-blur-xl">
        <Container size="lg">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" variant="header" className="hover:opacity-80 transition-opacity" href="/" />
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/marketplace"
                className="text-sm font-bold text-gray-500 hover:text-taja-secondary transition-colors uppercase tracking-widest"
              >
                Marketplace
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-bold text-taja-primary uppercase tracking-widest"
              >
                How it Works
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                    className="text-sm font-bold text-gray-500 hover:text-taja-secondary transition-colors flex items-center gap-2 uppercase tracking-widest"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 uppercase tracking-widest"
                  >
                    <LogOut className="h-4 w-4" />
                    Exit
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    href="/login"
                    className="text-sm font-bold text-gray-500 hover:text-taja-secondary transition-colors uppercase tracking-widest"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-taja-primary text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-emerald hover:shadow-emerald-hover transition-all active:scale-95"
                  >
                    Start Selling
                  </Link>
                </div>
              )}
            </div>
            <button
              className="md:hidden p-2 text-gray-400 hover:text-taja-primary transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <Section className="relative pt-20 pb-12 overflow-hidden">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-white/60 text-taja-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Rocket className="h-3 w-3" />
              <span>Future of Commerce</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-taja-secondary mb-8 leading-[1.1] tracking-tighter">
              A New Standard in{" "}
              <span className="text-white drop-shadow-[0_2px_2px_rgba(46,107,78,0.3)]">
                Experience
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
              Elevating Nigerian commerce with clinical precision, verified trust, and
              super-premium technology designed for the modern era.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="bg-taja-primary text-white px-10 py-5 rounded-full text-sm font-black uppercase tracking-[0.25em] shadow-emerald hover:shadow-emerald-hover transition-all flex items-center gap-3 active:scale-95"
              >
                Join the Elite
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/marketplace"
                className="glass-card border-white/60 text-taja-secondary px-10 py-5 rounded-full text-sm font-black uppercase tracking-[0.25em] hover:bg-white/40 transition-all active:scale-95"
              >
                Browse Curated
              </Link>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Tabs / Steps Section */}
      <Section className="relative py-24 mb-12">
        <Container size="lg">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.3em] mb-4">
              Operational Protocols
            </h2>
            <p className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tight">
              Simplified for Growth
            </p>
          </div>

          <div className="flex justify-center mb-16">
            <div className="glass-card p-1.5 rounded-full border-white/60 inline-flex">
              <button
                onClick={() => setActiveTab("seller")}
                className={`px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "seller"
                  ? "bg-taja-primary text-white shadow-emerald"
                  : "text-gray-400 hover:text-taja-secondary"
                  }`}
              >
                For Sellers
              </button>
              <button
                onClick={() => setActiveTab("buyer")}
                className={`px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "buyer"
                  ? "bg-taja-primary text-white shadow-emerald"
                  : "text-gray-400 hover:text-taja-secondary"
                  }`}
              >
                For Buyers
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-5 gap-6"
            >
              {(activeTab === "seller" ? sellerSteps : buyerSteps).map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative group">
                    <div className="glass-card p-8 rounded-[32px] border-white/60 h-full hover:shadow-premium transition-all duration-500 hover:-translate-y-2">
                      <div className="flex justify-between items-start mb-8">
                        <div className="text-4xl font-black text-taja-light/30 tracking-tighter">
                          {step.number}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-taja-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-taja-secondary mb-4 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        {step.description}
                      </p>
                    </div>
                    {index < 4 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ArrowRight className="h-6 w-6 text-taja-light/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section className="py-24 bg-taja-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-motif-blanc opacity-60" />
        <Container size="lg" className="relative">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.3em] mb-4">
              Technological Edge
            </h2>
            <p className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tight mb-6">
              Why Leaders Choose Taja
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-10 rounded-[40px] border-white/80 hover:shadow-premium-hover transition-all duration-500"
                >
                  <div className="w-16 h-16 rounded-3xl bg-taja-primary text-white flex items-center justify-center mb-8 shadow-emerald">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-taja-secondary mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-taja-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(46,107,78,0.4),transparent_70%)]" />
        <Container size="md" className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
              Ready to Define the Future?
            </h2>
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join Nigeria's most sophisticated commerce network. Deploy your shop
              instantly and scale with world-class infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register"
                className="bg-white text-taja-secondary px-12 py-5 rounded-full text-sm font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-gray-100 transition-all active:scale-95"
              >
                Start Selling
              </Link>
              <Link
                href="/marketplace"
                className="bg-taja-primary text-white px-12 py-5 rounded-full text-sm font-black uppercase tracking-[0.25em] shadow-emerald hover:shadow-emerald-hover transition-all active:scale-95"
              >
                Join Community
              </Link>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-taja-secondary/40 backdrop-blur-md md:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[80%] bg-motif-blanc shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-12">
                <Logo size="lg" variant="header" />
                <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-8">
                <Link
                  href="/marketplace"
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-black text-taja-secondary uppercase tracking-[0.1em]"
                >
                  Marketplace
                </Link>
                <Link
                  href="/how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-black text-taja-primary uppercase tracking-[0.1em]"
                >
                  How it Works
                </Link>
                {isAuthenticated ? (
                  <Link
                    href={user?.role === "seller" ? "/seller/dashboard" : "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className="text-2xl font-black text-gray-500 uppercase tracking-[0.1em]"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-2xl font-black text-gray-500 uppercase tracking-[0.1em]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="bg-taja-primary text-white px-8 py-5 rounded-full text-center text-sm font-black uppercase tracking-[0.2em] shadow-emerald"
                    >
                      Start Selling
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdvancedFooter />
    </div>
  );
}

