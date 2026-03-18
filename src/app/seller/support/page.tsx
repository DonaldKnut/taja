"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  AlertCircle,
  Package,
  CreditCard,
  Store,
  Truck,
  RefreshCw,
  HelpCircle,
  Send,
  FileText,
  Zap,
  Clock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supportApi } from "@/lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const categories = [
  { value: "order", label: "Order Issue", icon: Package, description: "Problems with a customer's order", color: "blue" },
  { value: "payout", label: "Payouts & Wallet", icon: CreditCard, description: "Issues with earnings or withdrawals", color: "emerald" },
  { value: "shop", label: "Shop Management", icon: Store, description: "Shop profile or settings help", color: "indigo" },
  { value: "technical", label: "Technical Support", icon: AlertCircle, description: "App errors or listing issues", color: "orange" },
  { value: "general", label: "General Inquiry", icon: HelpCircle, description: "Other merchant questions", color: "teal" },
];

const priorities = [
  { value: "low", label: "Normal", description: "Standard business query", dot: "bg-emerald-400" },
  { value: "medium", label: "Priority", description: "Important issue", dot: "bg-amber-400" },
  { value: "high", label: "Urgent", description: "Immediate attention needed", dot: "bg-rose-500" },
];

const colorMap: Record<string, { icon: string; ring: string; bg: string }> = {
  blue: { icon: "text-blue-500", ring: "border-blue-500/20", bg: "bg-blue-50" },
  emerald: { icon: "text-emerald-500", ring: "border-emerald-500/20", bg: "bg-emerald-50" },
  indigo: { icon: "text-indigo-500", ring: "border-indigo-500/20", bg: "bg-indigo-50" },
  orange: { icon: "text-orange-500", ring: "border-orange-500/20", bg: "bg-orange-50" },
  teal: { icon: "text-teal-500", ring: "border-teal-500/20", bg: "bg-teal-50" },
};

function SellerSupportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrder = searchParams.get("order") || searchParams.get("orderId");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: prefillOrder ? "order" : "general",
    priority: "medium",
    relatedOrderId: prefillOrder || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setLoading(true);
      const res = await supportApi.createTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        relatedOrderId: formData.relatedOrderId || undefined,
      });
      if (res.success) {
        toast.success("Support ticket created! We'll get back to you soon.");
        router.push(`/seller/support/tickets/${res.data._id}`);
      } else {
        toast.error(res.message || "Failed to create ticket");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/seller/dashboard">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white shadow-sm border border-gray-100 h-14 w-14">
                <ArrowLeft className="h-6 w-6 text-taja-secondary" />
              </Button>
            </Link>
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <Link href="/seller" className="hover:text-taja-primary">Merchant Hub</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-taja-secondary">Support Centre</span>
              </nav>
              <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic leading-none">
                Merchant <span className="text-taja-primary">Help Desk</span>
              </h1>
            </div>
          </div>

          <Link href="/seller/support/tickets">
            <Button variant="outline" className="h-14 rounded-2xl glass-card border-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm px-8">
              <FileText className="h-4 w-4 mr-2" />
              My Support Tickets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[3rem] p-8 sm:p-12 border-white/60 shadow-premium relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-taja-primary/5 blur-[100px] rounded-full pointer-events-none" />

              <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                
                {/* Category Selection */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Subject Area</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const colors = colorMap[cat.color];
                      const isSelected = formData.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, category: cat.value }))}
                          className={cn(
                            "group p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300",
                            isSelected 
                              ? `${colors.ring} ${colors.bg} shadow-sm ring-1 ring-white/50` 
                              : "border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                            isSelected ? "bg-white shadow-sm" : "bg-white"
                          )}>
                            <Icon className={cn("h-6 w-6", isSelected ? colors.icon : "text-gray-300")} />
                          </div>
                          <p className={cn("text-xs font-black uppercase tracking-tight mb-1", isSelected ? "text-taja-secondary" : "text-gray-500")}>
                            {cat.label}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400 leading-tight">
                            {cat.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Urgency Levels</h3>
                  <div className="flex flex-wrap gap-3">
                    {priorities.map((p) => {
                      const isSelected = formData.priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData(p_ => ({ ...p_, priority: p.value }))}
                          className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300",
                            isSelected 
                              ? "border-taja-primary bg-taja-primary/5 text-taja-primary shadow-sm ring-1 ring-white/50" 
                              : "border-gray-50 bg-gray-50/50 text-gray-400 hover:bg-white"
                          )}
                        >
                          <div className={cn("h-2 w-2 rounded-full", p.dot)} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Request Heading</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                      required
                      placeholder="e.g., Payout delayed for Order #..."
                      className="w-full h-16 rounded-2xl px-6 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-taja-primary/40 focus:ring-4 focus:ring-taja-primary/5 transition-all text-sm font-bold text-taja-secondary placeholder:text-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Detailed Narrative</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                      required
                      rows={8}
                      placeholder="Please provide specifics. The more detail you include, the faster we can assist."
                      className="w-full rounded-3xl p-6 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-taja-primary/40 focus:ring-4 focus:ring-taja-primary/5 transition-all text-sm font-medium text-taja-secondary placeholder:text-gray-300 leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Linked Order Badge */}
                <AnimatePresence>
                  {prefillOrder && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 px-6 py-4 rounded-[2rem] bg-indigo-50 border border-indigo-100 w-fit"
                    >
                      <Package className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Linked Context</p>
                        <p className="text-xs font-black text-indigo-600">Order #{prefillOrder.slice(-8).toUpperCase()}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-20 w-full md:w-auto md:px-16 rounded-3xl bg-taja-secondary hover:bg-black text-[11px] font-black uppercase tracking-[0.2em] shadow-huge hover:-translate-y-1 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-3" />
                    ) : (
                      <Send className="h-4 w-4 mr-3" />
                    )}
                    {loading ? "Transmitting..." : "Submit Support Ticket"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-taja-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-taja-primary" />
                  </div>
                  <h4 className="text-sm font-black text-taja-secondary uppercase tracking-tight">Resolution Intel</h4>
                </div>
                <ul className="space-y-4">
                  {[
                    { text: "Include relevant Order IDs", icon: Package },
                    { text: "Detailed problem breakdown", icon: Zap },
                    { text: "Response within 24 hours", icon: Clock },
                    { text: "Global merchant protection", icon: ShieldCheck },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group">
                      <div className="h-2 w-2 rounded-full bg-taja-primary/20 group-hover:bg-taja-primary transition-colors" />
                      <p className="text-xs font-bold text-gray-500">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 text-center">Protocol Speed</p>
                <div className="space-y-3">
                  {[
                    { label: "High Priority", time: "2-4 hrs", color: "text-rose-500" },
                    { label: "Standard", time: "12-24 hrs", color: "text-amber-500" },
                    { label: "Account Setup", time: "4-8 hrs", color: "text-indigo-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", row.color)}>{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* In-app support alert */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-taja-primary to-taja-primary/80 shadow-emerald relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-24 h-24 text-white" />
              </div>
              <div className="relative z-10">
                <h4 className="text-white font-black uppercase tracking-tighter italic text-xl mb-2">Merchant Safety</h4>
                <p className="text-white/80 text-[10px] font-bold leading-relaxed mb-6">Your account is under Tajá Direct Merchant Protection.</p>
                <Link href="/seller/policies">
                  <Button className="bg-white text-taja-primary hover:bg-white/90 rounded-xl h-10 w-full text-[9px] font-black uppercase tracking-widest">
                    View Protection Docs
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SellerSupportPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
          <RefreshCw className="h-10 w-10 animate-spin text-taja-primary" />
        </div>
      }
    >
      <SellerSupportPageInner />
    </Suspense>
  );
}
