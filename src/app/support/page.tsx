"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  AlertCircle,
  Package,
  CreditCard,
  User,
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
} from "lucide-react";
import { supportApi } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const categories = [
  { value: "order", label: "Order Issue", icon: Package, description: "Problems with your order", color: "amber" },
  { value: "payment", label: "Payment", icon: CreditCard, description: "Payment or refund questions", color: "emerald" },
  { value: "product", label: "Product", icon: Package, description: "Questions about a product", color: "indigo" },
  { value: "delivery", label: "Delivery", icon: Truck, description: "Shipping problems", color: "blue" },
  { value: "refund", label: "Refund", icon: RefreshCw, description: "Request a refund", color: "rose" },
  { value: "account", label: "Account", icon: User, description: "Profile problems", color: "violet" },
  { value: "technical", label: "Technical", icon: AlertCircle, description: "App or site issues", color: "orange" },
  { value: "general", label: "General", icon: HelpCircle, description: "Other questions", color: "teal" },
];

const priorities = [
  { value: "low", label: "Low", description: "Not urgent", dot: "bg-emerald-400" },
  { value: "medium", label: "Medium", description: "Normal priority", dot: "bg-amber-400" },
  { value: "high", label: "High", description: "Urgent", dot: "bg-orange-400" },
  { value: "urgent", label: "Urgent", description: "Immediate", dot: "bg-rose-500" },
];

const colorMap: Record<string, { icon: string; ring: string; bg: string }> = {
  amber: { icon: "text-amber-400", ring: "border-amber-400/60", bg: "bg-amber-400/10" },
  emerald: { icon: "text-emerald-400", ring: "border-emerald-400/60", bg: "bg-emerald-400/10" },
  indigo: { icon: "text-indigo-400", ring: "border-indigo-400/60", bg: "bg-indigo-400/10" },
  blue: { icon: "text-blue-400", ring: "border-blue-400/60", bg: "bg-blue-400/10" },
  rose: { icon: "text-rose-400", ring: "border-rose-400/60", bg: "bg-rose-400/10" },
  violet: { icon: "text-violet-400", ring: "border-violet-400/60", bg: "bg-violet-400/10" },
  orange: { icon: "text-orange-400", ring: "border-orange-400/60", bg: "bg-orange-400/10" },
  teal: { icon: "text-teal-400", ring: "border-teal-400/60", bg: "bg-teal-400/10" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

function SupportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get("orderId");
  const prefillProductId = searchParams.get("productId");
  const prefillShopId = searchParams.get("shopId");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: prefillOrderId ? "order" : prefillProductId ? "product" : "general",
    priority: "medium",
    relatedOrderId: prefillOrderId || "",
    relatedProductId: prefillProductId || "",
    relatedShopId: prefillShopId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        relatedProductId: formData.relatedProductId || undefined,
        relatedShopId: formData.relatedShopId || undefined,
      });
      if (res.success) {
        toast.success("Support ticket created! We'll get back to you soon.");
        router.push(`/support/tickets/${res.data._id}`);
      } else {
        toast.error(res.message || "Failed to create ticket");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorities.find((p) => p.value === formData.priority);

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* ── Background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-taja-primary/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Hero header ── */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-6 bg-taja-primary rounded-full" />
            <p className="text-taja-primary text-[10px] font-black uppercase tracking-[0.3em]">Help Centre</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none italic mb-3">
            How Can We<br />Help You?
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
            Create a support ticket and our team will respond within 24 hours. The more detail, the faster we help.
          </p>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: Clock, label: "Avg. Response", value: "< 24 hrs", color: "text-amber-400", bg: "bg-amber-400/10" },
            { icon: CheckCircle, label: "Issues Resolved", value: "98%", color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { icon: ShieldCheck, label: "Satisfaction", value: "4.9 / 5", color: "text-blue-400", bg: "bg-blue-400/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className={`text-lg font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main form ── */}
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="lg:col-span-2"
          >
            <div className="relative rounded-[2rem] bg-slate-950 border border-slate-800 overflow-hidden p-6 sm:p-8">
              {/* Card decoration */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-taja-primary/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute inset-0 motif-blanc opacity-[0.02] pointer-events-none" />

              <div className="relative z-10">
                {/* Card header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-2xl bg-taja-primary/10 border border-taja-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-taja-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">New Support Ticket</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fill out the form below</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">

                  {/* ── Category grid ── */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      What can we help with? *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const colors = colorMap[cat.color];
                        const selected = formData.category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, category: cat.value }))
                            }
                            className={`group relative p-3.5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${selected
                                ? `${colors.ring} ${colors.bg}`
                                : "border-slate-800 bg-slate-900 hover:border-slate-700"
                              }`}
                          >
                            <Icon
                              className={`h-4 w-4 mb-2 transition-colors ${selected ? colors.icon : "text-slate-500 group-hover:text-slate-400"
                                }`}
                            />
                            <div className={`font-black text-xs leading-tight ${selected ? "text-white" : "text-slate-400"}`}>
                              {cat.label}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{cat.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Priority pills ── */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      Priority *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map((p) => {
                        const selected = formData.priority === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, priority: p.value }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${selected
                                ? "border-taja-primary bg-taja-primary/10 text-white"
                                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${p.dot} ${selected ? "" : "opacity-50"}`} />
                            {p.label}
                            <span className={`text-[10px] font-medium ${selected ? "text-slate-300" : "text-slate-600"}`}>
                              — {p.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Subject ── */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      maxLength={200}
                      placeholder="Brief description of your issue"
                      className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-taja-primary/50 focus:ring-1 focus:ring-taja-primary/30 transition-all"
                    />
                  </div>

                  {/* ── Description ── */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Please provide as much detail as possible — order numbers, product names, screenshots or anything that can help us assist you faster."
                      className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-taja-primary/50 focus:ring-1 focus:ring-taja-primary/30 transition-all resize-none"
                    />
                    <p className="text-[10px] text-slate-600 mt-1.5 font-medium">
                      The more details you provide, the faster we can help you.
                    </p>
                  </div>

                  {/* Prefilled hidden fields */}
                  {formData.relatedOrderId && (
                    <input type="hidden" name="relatedOrderId" value={formData.relatedOrderId} />
                  )}
                  {formData.relatedProductId && (
                    <input type="hidden" name="relatedProductId" value={formData.relatedProductId} />
                  )}
                  {formData.relatedShopId && (
                    <input type="hidden" name="relatedShopId" value={formData.relatedShopId} />
                  )}

                  {/* Show linked order pill if prefilled */}
                  {prefillOrderId && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-taja-primary/5 border border-taja-primary/20 w-fit">
                      <Package className="h-3.5 w-3.5 text-taja-primary" />
                      <span className="text-xs text-taja-primary font-bold">
                        Linked Order: {prefillOrderId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => router.push("/support/tickets")}
                      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
                    >
                      <FileText className="h-4 w-4" />
                      My Tickets
                      <ChevronRight className="h-3 w-3" />
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-taja-primary hover:bg-taja-primary/90 text-white text-sm font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,42,109,0.3)] hover:shadow-[0_0_30px_rgba(255,42,109,0.5)]"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>

          {/* ── Sidebar ── */}
          <motion.div
            custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="space-y-4"
          >
            {/* Tips card */}
            <div className="relative rounded-[2rem] bg-slate-950 border border-slate-800 overflow-hidden p-6">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Tips for Faster Help</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Include order numbers or product names",
                    "Be specific about what went wrong",
                    "Check your email for our reply",
                    "View all your tickets in My Tickets",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Response time card */}
            <div className="relative rounded-[2rem] bg-slate-950 border border-slate-800 overflow-hidden p-6">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/8 rounded-full blur-[50px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Response Times</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { priority: "Urgent", time: "2–4 hrs", dot: "bg-rose-500" },
                    { priority: "High", time: "4–8 hrs", dot: "bg-orange-400" },
                    { priority: "Medium", time: "12–24 hrs", dot: "bg-amber-400" },
                    { priority: "Low", time: "24–48 hrs", dot: "bg-emerald-400" },
                  ].map((row) => (
                    <div key={row.priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${row.dot}`} />
                        <span className="text-xs font-bold text-slate-400">{row.priority}</span>
                      </div>
                      <span className="text-xs font-black text-white">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View tickets CTA */}
            <button
              onClick={() => router.push("/support/tickets")}
              className="group w-full flex items-center justify-between p-5 rounded-[2rem] bg-slate-950 border border-slate-800 hover:border-taja-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-taja-primary/10 border border-taja-primary/20 flex items-center justify-center">
                  <FileText className="h-4.5 w-4.5 text-taja-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-white">My Tickets</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">View history</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-taja-primary transition-colors" />
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-[3px] border-slate-800 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-taja-primary rounded-full border-t-transparent animate-spin" />
          </div>
        </div>
      }
    >
      <SupportPageInner />
    </Suspense>
  );
}
