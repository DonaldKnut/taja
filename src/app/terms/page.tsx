"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { FileText, ArrowLeft, Shield, CheckCircle2, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
  const lastUpdated = "10 March 2026";

  const sections = [
    {
      number: "01",
      title: "Definitions",
      content: "“Platform”, “Taja.Shop”, “we”, “us” or “our” refers to Taja Shop Technologies Limited, a company incorporated in Nigeria. “User”, “you” or “your” refers to any person accessing or using the Platform, including Buyers, Sellers and Visitors. “Products” means goods or digital services listed for sale on the Platform. “Escrow” refers to the settlement framework managed by our licensed payment partners.",
    },
    {
      number: "02",
      title: "Eligibility & Registration",
      content: "You must be at least 18 years old, have legal capacity to contract and reside in a territory where we operate. By creating an account you confirm that all information supplied is accurate and up to date. We may request additional verification (including Bank Verification Number, NIN or CAC filings) before activating or maintaining seller privileges.",
    },
    {
      number: "03",
      title: "Marketplace Relationship",
      content: "Taja.Shop provides a technology marketplace that connects independent Sellers and Buyers. Unless expressly stated, we are not a party to transactions between users. Sellers act as independent merchants responsible for their listings, compliance, warranties, taxes and customer support.",
    },
    {
      number: "04",
      title: "Product Standards",
      content: "Sellers must ensure that every product or service listed is lawful, accurately described, and accompanied by authentic photographs. Counterfeit, dangerous, or restricted items are strictly prohibited. We reserve the right to remove any listing that violates our safety standards.",
    },
    {
      number: "05",
      title: "Escrow, Platform Fees & Taxes",
      content:
        "All prices must be quoted in Nigerian Naira (₦). We process payments via PCI‑DSS compliant partners and operate an escrow-based settlement framework. When you place an order, you authorize us and our payment partners to hold funds on your behalf until delivery is confirmed or an investigation is concluded. Funds are remitted to Sellers net of Taja.Shop platform fees and applicable statutory taxes (including VAT where required by law). The applicable platform fee percentage and settlement timelines may be updated from time to time and are reflected in your dashboard.",
    },
    {
      number: "06",
      title: "Disputes, Refunds & Auto‑Release",
      content:
        "If a Buyer believes a product is defective, damaged or not as described, they must raise a dispute through the Platform within the dispute window communicated at checkout or in the order screen (for example, within 7 days of marked delivery). Where no dispute is raised within that window, funds may be automatically released from escrow to the Seller. If a dispute is opened in time, funds are held while our team reviews evidence in line with the Seller’s stated policy and applicable Nigerian consumer law. Depending on the outcome, we may authorize a partial or full refund to the Buyer or release funds to the Seller.",
    },
    {
      number: "07",
      title: "Data Protection",
      content: "Our processing of personal data is governed by the Taja.Shop Privacy Policy and the Nigerian Data Protection Regulation (NDPR). Sellers must also comply with NDPR requirements when handling Buyer information for fulfilment.",
    },
    {
      number: "08",
      title: "Termination",
      content: "We may suspend or terminate access if we suspect policy breaches, fraud, or regulatory risk. You remain liable for outstanding obligations post-termination. Sellers may close stores upon 7 days’ written notice provided all orders are fulfilled.",
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-taja-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-taja-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/40 shadow-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Logo size="lg" variant="header" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/privacy" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-taja-primary transition-colors">Privacy</Link>
              <Link href="/how-it-works" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-taja-primary transition-colors">Support</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-xs font-black text-taja-secondary uppercase tracking-widest hover:text-taja-primary cursor-pointer transition-colors px-4">Sign In</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-6 shadow-premium">Start Selling</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-light/30 border border-taja-primary/10 shadow-sm mb-4">
            <Shield className="w-4 h-4 text-taja-primary" />
            <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em]">Legal Framework</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-taja-secondary tracking-tighter leading-[0.9]">
            Terms of <br />
            <span className="text-transparent bg-clip-text bg-gradient-taja">Service.</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Welcome to the Taja ecosystem. These terms establish the secure and professional environment for Nigeria's elite digital merchants.
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest pt-4">
            <CheckCircle2 className="w-3 h-3 text-taja-primary" />
            Last Updated: {lastUpdated}
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {sections.map((section) => (
            <motion.div
              key={section.number}
              variants={itemVariants}
              className="glass-card p-10 rounded-[2rem] border-white/60 shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8">
                <span className="text-6xl font-black text-gray-50/50 select-none group-hover:text-taja-primary/5 transition-colors">{section.number}</span>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-taja-light/50 flex items-center justify-center group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                  <FileText className="w-5 h-5 text-taja-primary group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-taja-secondary tracking-tight">{section.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 glass-panel p-12 rounded-[3rem] text-center border-white/40 shadow-premium"
        >
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-taja-primary/10 flex items-center justify-center">
                <Info className="w-8 h-8 text-taja-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-taja-secondary tracking-tight">Need further clarification?</h2>
            <p className="text-gray-400 font-medium text-sm px-4">
              Our legal and support teams are available 24/7 to assist elite merchants with any procedural or compliance enquiries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-10 shadow-premium">Start Selling</Button>
              <Link href="/privacy" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full rounded-full px-10">Read Privacy Policy</Button>
              </Link>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-taja-primary transition-all mt-8">
              <ArrowLeft className="w-3 h-3" /> Back to Marketplace Hub
            </Link>
          </div>
        </motion.div>

        {/* Global Footer Minimal */}
        <div className="mt-20 text-center pb-12">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            &copy; 2026 Taja Tech Innovations Limited. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}