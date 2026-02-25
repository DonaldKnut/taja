"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Shield, ArrowLeft, Lock, Eye, Database, Globe, Bell, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const lastUpdated = "8 November 2025";

  const sections = [
    {
      icon: Lock,
      title: "Data Stewardship",
      content: "Taja Tech Innovations Limited is the data controller responsible for personal data processed through the marketplace. We comply with the Nigerian Data Protection Regulation (NDPR) and the Data Protection Act 2023.",
    },
    {
      icon: Database,
      title: "Data Collection",
      content: "We collect Identity & Contact data (name, email, shipping address), account credentials, and Financial Data (masked payment details). For sellers, we verify NIN/CAC filings to ensure marketplace integrity.",
    },
    {
      icon: Eye,
      title: "How We Use Data",
      content: "Data is processed to authenticate accounts, facilitate escrow payments, and manage logistics. We also use anonymized analytics to sharpen our recommendation engines and security safeguards.",
    },
    {
      icon: Globe,
      title: "Global Transfers",
      content: "Our primary infrastructure resides in Nigeria and the European Union. All cross-border transfers implement Standard Contractual Clauses and industrial-grade encryption protocols to ensure NDPR equivalence.",
    },
    {
      icon: Shield,
      title: "Security Protocols",
      content: "We implement TLS 1.3 encryption, AES-256 storage, and 24/7 SIEM monitoring. Regular third-party penetration tests are conducted to maintain bank-level security for our merchants.",
    },
    {
      icon: Bell,
      title: "Communications",
      content: "By joining Taja, you receive essential security and transactional alerts. You may opt in for curated elite merchant insights and marketplace growth strategies through your profile settings.",
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white"></div>
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-taja-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-taja-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/40 shadow-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Logo size="lg" variant="header" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/terms" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-taja-primary transition-colors">Terms</Link>
              <Link href="/how-it-works" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-taja-primary transition-colors">Safety</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-black text-taja-secondary uppercase tracking-widest hover:text-taja-primary cursor-pointer transition-colors px-4">Sign In</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-6 shadow-premium">Join Hub</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-light/30 border border-taja-primary/10 shadow-sm mb-4">
            <Lock className="w-4 h-4 text-taja-primary" />
            <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em]">Data Protection</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-taja-secondary tracking-tighter leading-[0.85]">
            Privacy <br />
            <span className="text-transparent bg-clip-text bg-gradient-taja">Protocols.</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Your data is your legacy. We've engineered the Taja infrastructure with a clinical focus on security, transparency, and merchant sovereignty.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-taja-primary animate-ping"></div>
              <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest leading-none">NDPR Compliant</span>
            </div>
            <div className="w-px h-4 bg-gray-100 hidden sm:block"></div>
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Last Audit: Dec 2025</div>
          </div>
        </motion.div>

        {/* Dynamic Content Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="glass-card p-8 rounded-[2.5rem] border-white/60 shadow-premium hover:shadow-premium-hover hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="space-y-6">
                <div className="h-14 w-14 rounded-[1.25rem] bg-taja-light/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <section.icon className="w-6 h-6 text-taja-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-taja-secondary tracking-tight">{section.title}</h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="glass-panel p-10 sm:p-14 rounded-[3.5rem] border-white/40 shadow-premium flex flex-col justify-center space-y-8">
            <h2 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
              Exercise Your <br />
              <span className="text-taja-primary">Rights.</span>
            </h2>
            <p className="text-gray-400 font-medium">
              Merchant sovereignty is at the core of our philosophy. Access, port, or erase your data at any time via our secure portal or direct legal channel.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-taja-light flex items-center justify-center group-hover:bg-taja-primary transition-colors">
                  <Lock className="w-4 h-4 text-taja-primary group-hover:text-white" />
                </div>
                <span className="text-xs font-black text-taja-secondary uppercase tracking-widest">Privacy Dashboard</span>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-taja-light flex items-center justify-center group-hover:bg-taja-primary transition-colors">
                  <Database className="w-4 h-4 text-taja-primary group-hover:text-white" />
                </div>
                <span className="text-xs font-black text-taja-secondary uppercase tracking-widest">Data Portability Tool</span>
              </div>
            </div>
          </div>

          <div className="bg-taja-secondary p-10 sm:p-14 rounded-[3.5rem] shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-8">
              <Phone className="w-10 h-10 text-taja-primary" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Direct Escalation</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed">
                  Have specific privacy concerns or institutional data requirements? Contact our Data Protection Officer directly.
                </p>
              </div>
              <div className="space-y-4 pt-4">
                <div className="text-lg font-black text-taja-primary tracking-tight">privacy@taja.shop</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Plot 5 Admiralty Road, Lekki Phase 1, Lagos</div>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all pt-8">
                <ArrowLeft className="w-3 h-3" /> Marketplace Hub
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Global Footer Minimal */}
        <div className="mt-24 text-center pb-12">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            &copy; 2026 Taja Tech Innovations Limited. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
