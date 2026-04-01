"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  ArrowRight,
  Shield,
  Truck,
  CreditCard,
  Headphones,
  Star,
  Globe,
  Sparkles,
  Zap,
  CheckCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

const footerSections = [
  {
    title: "Marketplace",
    links: [
      { name: "Shopper Hub", href: "/marketplace" },
      { name: "Trusted Artisans", href: "/sellers" },
      { name: "Trending Now", href: "/trending" },
      { name: "New Arrivals", href: "/new" },
    ],
  },
  {
    title: "Sell on Taja",
    links: [
      { name: "Launch Your Shop", href: "/register" },
      { name: "Seller Terminal", href: "/seller/dashboard" },
      { name: "Founder Academy", href: "/academy" },
      { name: "Logistics Portal", href: "/shipping" },
    ],
  },
  {
    title: "How it Works",
    links: [
      { name: "Buyer Tutorial", href: "/how-it-works" },
      { name: "Secure Wallet", href: "/wallet" },
      { name: "Rewards Program", href: "/rewards" },
      { name: "Direct Checkout", href: "/checkout-info" },
    ],
  },
  {
    title: "Trust & Safety",
    links: [
      { name: "Verification", href: "/onboarding/kyc" },
      { name: "Buyer Protection", href: "/protection" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const socialLinks = [
  { name: "X", href: "#", icon: Twitter, color: "hover:text-taja-primary" },
  { name: "Instagram", href: "#", icon: Instagram, color: "hover:text-pink-500" },
  { name: "LinkedIn", href: "#", icon: Linkedin, color: "hover:text-blue-600" },
  { name: "Discord", href: "#", icon: Globe, color: "hover:text-indigo-500" },
];

const stats = [
  { number: "100%", label: "System Uptime" },
  { number: "5,000+", label: "Safe Transactions" },
  { number: "4.9/5", label: "Community Rating" },
];

export function AdvancedFooter() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      z.string().email("Invalid email").parse(email);
      setIsSubscribing(true);
      // Simulate API call
      await new Promise(r => setTimeout(r, 1500));
      setIsSubscribing(false);
      setEmail("");
      // toast.success("Subscribed to newsletter!");
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        // toast.error(err.errors[0].message);
      }
    }
  };

  return (
    <footer className="relative bg-[#022c22] text-white pt-24 pb-12 overflow-hidden selection:bg-white/20">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-400/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-taja-primary/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute inset-0 bg-motif-blanc opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Newsletter / Neural Sync Section */}
        <div className="relative mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-panel rounded-[48px] p-8 sm:p-12 border-white/10 bg-white/[0.05] relative overflow-hidden group hover:border-white/20 transition-colors duration-500"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-3xl -mr-32 -mt-32 group-hover:bg-taja-primary/10 transition-colors" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-taja-primary/10 border border-taja-primary/20 mb-6">
                  <Sparkles className="h-4 w-4 text-taja-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-taja-primary">Stay in the loop</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter leading-tight italic uppercase">
                  Join our <span className="text-taja-primary">Newsletters</span>
                </h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Get the latest updates, curator insights, and exclusive marketplace drops delivered straight to your inbox.
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="w-full max-w-md">
                <div className="relative group">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-16 rounded-2xl bg-white/[0.05] border-white/20 pl-6 pr-40 text-white placeholder-emerald-100/30 focus:border-white focus:bg-white/[0.08] transition-all font-medium"
                    required
                  />
                  <div className="absolute right-2 top-2 bottom-2">
                    <Button
                      disabled={isSubscribing}
                      className="h-full rounded-xl bg-white text-[#022c22] hover:bg-emerald-50 font-black uppercase tracking-[0.15em] px-6 shadow-xl transition-all active:scale-95"
                    >
                      {isSubscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Subscribe"}
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-500 px-2 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Your data is secure with Taja
                </p>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Brand & Links Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-24">
          <div className="col-span-full lg:col-span-4">
            <Logo size="lg" className="mb-8 invert opacity-90" />
            <p className="text-gray-400 font-medium leading-relaxed mb-8 max-w-sm">
              The best way to buy and sell in Lagos. A safe and easy marketplace built for everyone.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`w-12 h-12 rounded-[18px] flex items-center justify-center bg-white/[0.05] border border-white/10 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.1] group ${social.color}`}
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:rotate-6" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="col-span-full lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-gray-400 hover:text-taja-primary transition-colors flex items-center group gap-1"
                      >
                        {link.name}
                        <ChevronRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Trust Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-24">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="glass-panel p-8 rounded-[32px] border-white/10 bg-white/[0.05] hover:bg-white/[0.08] transition-colors group text-center"
            >
              <div className={`text-4xl font-black mb-2 tracking-tighter transition-colors ${stat.label === "Neural Uptime" ? "text-white" : "text-white/80 group-hover:text-white"
                }`}>
                {stat.number}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Matrix */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center md:text-left">
            © 2024 • Taja Tech Innovations Limited • Built for the Visionary
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: "Innovation API", icon: Zap },
              { label: "SSL Shield", icon: Shield },
              { label: "Cloud Sync", icon: Globe },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <item.icon className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-8">
            {["Services", "Support", "Community"].map((label) => (
              <Link key={label} href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
