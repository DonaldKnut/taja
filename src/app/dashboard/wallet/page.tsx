"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  TrendingUp,
  ShieldCheck,
  Plus,
  CreditCard,
  ArrowRight,
  Search,
  ChevronRight,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type BalanceResponse = {
  success: boolean;
  data?: {
    currency: string;
    available: { kobo: number; naira: number };
    held: { kobo: number; naira: number };
  };
};

type WalletTx = {
  _id: string;
  type: string;
  status: string;
  direction: "credit" | "debit";
  amount: number; // kobo
  currency: string;
  reference: string;
  description?: string;
  createdAt: string;
};

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [amount, setAmount] = useState("2000");
  const [balance, setBalance] = useState<BalanceResponse["data"] | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [points, setPoints] = useState<number | null>(null);

  const fundingStatus = searchParams.get("funding");
  const fundingReference = searchParams.get("reference");

  const refresh = async () => {
    setLoading(true);
    try {
      const [b, t, me] = await Promise.all([
        api("/api/wallet/balance") as Promise<BalanceResponse>,
        api("/api/wallet/transactions?limit=25") as Promise<any>,
        api("/api/users/me") as Promise<{ success?: boolean; data?: { points?: number } }>,
      ]);
      if (b?.success) setBalance(b.data || null);
      const items = t?.data?.transactions || t?.data?.items || t?.transactions || [];
      if (Array.isArray(items)) setTxs(items);
      if (me?.data && typeof me.data.points === "number") setPoints(me.data.points);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!fundingStatus) return;
    if (fundingStatus === "success") toast.success("Wallet funded successfully");
    else if (fundingStatus === "failed") toast.error("Wallet funding failed");
    else if (fundingStatus === "verify_error") toast.error("Could not verify payment yet.");
    refresh();
  }, [fundingStatus, fundingReference]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const handleFund = async () => {
    if (!parsedAmount || parsedAmount < 100) {
      toast.error("Minimum funding amount is ₦100");
      return;
    }
    setFunding(true);
    try {
      const res = await api("/api/wallet/fund", {
        method: "POST",
        body: JSON.stringify({ amount: parsedAmount }),
      }) as any;
      const paymentUrl = res?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      toast.error(res?.message || "Failed to initialize funding");
    } catch (e: any) {
      toast.error(e?.message || "Failed to initialize funding");
    } finally {
      setFunding(false);
    }
  };

  const filteredHistory = txs.filter(tx =>
    (tx.description || tx.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-14 py-10 pb-24 px-4 md:px-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tight leading-tight">
              Your Taja wallet
            </h1>
            <p className="text-base text-gray-500 max-w-lg leading-relaxed">
              Add money, see what&apos;s available to spend, and track money held in escrow for active orders.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="group relative flex items-center justify-center px-10 h-16 bg-taja-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-emerald hover:shadow-emerald-hover transition-all active:scale-95 overflow-hidden"
              onClick={handleFund}
              disabled={funding}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
              <PlusCircle className="mr-3 h-4 w-4" />
              {funding ? "Synching..." : "Inject Capital"}
            </button>
          </div>
        </div>

        {/* Reward points (earned from purchases) */}
        {points !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-[2rem] border border-taja-primary/20 bg-gradient-to-r from-taja-primary/5 via-white to-taja-primary/5 p-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(46,107,78,0.08),transparent_70%)]" />
            <div className="relative rounded-[1.8rem] bg-white/60 backdrop-blur-xl px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-taja-primary/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="h-6 w-6 text-taja-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-taja-secondary tracking-tight">Reward points</p>
                  <p className="text-[13px] text-gray-500 font-medium leading-tight">
                    You earn points each time you confirm delivery. We give 1 point for every ₦100 you spend.
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-taja-primary tabular-nums tracking-tighter">{points.toLocaleString()}</span>
                <span className="text-xs font-black text-taja-primary/40 uppercase tracking-widest">pts</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Balance Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative group overflow-hidden rounded-[3.5rem] shadow-premium h-[380px]"
          >
            {/* Dynamic Glass Surface */}
            <div className="absolute inset-0 bg-[#0A0A0A] transition-all duration-700 group-hover:bg-[#050505]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,107,78,0.25),transparent_70%)]" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-taja-primary/10 blur-[130px] rounded-full" />
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-taja-primary/5 blur-[130px] rounded-full" />

            <div className="relative p-12 text-white flex flex-col h-full">
              <div className="flex items-center justify-between mb-auto">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-taja-primary/30 transition-colors duration-500">
                    <Wallet className="w-7 h-7 text-taja-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 leading-none">Available balance</h3>
                    <p className="text-xs font-bold text-white/60">Spending power available now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-taja-primary/10 border border-taja-primary/20 text-taja-primary text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <ShieldCheck className="w-4 h-4" /> Secure & Verified
                </div>
              </div>

              <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20">Total Balance</p>
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl md:text-8xl font-black tracking-tighter tabular-nums text-white">
                         {formatCurrency(balance?.available?.naira ?? 0).split('.')[0]}
                         <span className="text-3xl md:text-4xl text-white/30 font-medium">.{formatCurrency(balance?.available?.naira ?? 0).split('.')[1] || '00'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 pb-2">
                    <button 
                      className="group/btn h-14 w-14 rounded-full bg-white text-taja-secondary flex items-center justify-center shadow-2xl hover:bg-taja-primary hover:text-white transition-all transform hover:-translate-y-2 active:scale-90"
                      onClick={() => toast.success("Feature coming soon: Transfer funds")}
                    >
                      <ArrowUpRight className="w-6 h-6 group-hover/btn:rotate-45 transition-transform" />
                    </button>
                    <button 
                      className="h-14 rounded-full px-10 bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95" 
                      onClick={refresh}
                    >
                      Sync Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group overflow-hidden rounded-[3.5rem] bg-white border border-gray-100 shadow-premium p-10 flex flex-col justify-between h-[380px]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.03),transparent_60%)]" />
            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/5 flex items-center justify-center border border-amber-500/10 group-hover:border-amber-500/30 transition-colors duration-500">
                  <ShieldCheck className="w-7 h-7 text-amber-500" />
                </div>
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">In Escrow</div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">Escrow Balance</h3>
                  <p className="text-4xl font-black text-taja-secondary tracking-tight">{formatCurrency(balance?.held?.naira ?? 0)}</p>
                </div>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed pr-4">
                  For your protection, these funds are held securely until you confirm delivery of your active orders.
                </p>
              </div>
            </div>

            <div className="relative pt-8 border-t border-gray-50 mt-auto">
              <button className="w-full h-14 rounded-2xl border border-gray-100 text-[11px] font-black uppercase tracking-widest text-taja-secondary hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm">
                Active Orders <ChevronRight className="w-4 h-4 text-taja-primary" />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-taja-secondary/5 flex items-center justify-center text-taja-secondary border border-taja-secondary/5">
                  <History className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-taja-secondary uppercase tracking-[0.2em]">Transaction History</h2>
              </div>

              <div className="relative group min-w-[300px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-taja-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 h-14 rounded-2xl bg-white border border-gray-100 text-[11px] font-black uppercase tracking-[0.2em] focus:ring-4 focus:ring-taja-primary/5 focus:border-taja-primary/30 transition-all w-full shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 glass-card animate-pulse rounded-3xl border-white/60 shadow-premium" />
                  ))}
                </div>
              ) : filteredHistory.length > 0 ? (
                <AnimatePresence>
                  {filteredHistory.map((tx, idx) => {
                    const isCredit = tx.direction === "credit";
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={tx._id}
                        className="group glass-panel p-6 rounded-[2rem] border-white/60 hover:border-taja-primary/20 transition-all duration-300 flex items-center justify-between shadow-premium bg-white/50"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isCredit
                            ? "bg-emerald-500/5 text-emerald-500 border border-emerald-500/10"
                            : "bg-red-500/5 text-red-500 border border-red-500/10"
                            }`}>
                            {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-taja-secondary uppercase tracking-tight">{tx.description || tx.type.replace(/_/g, " ")}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                {new Date(tx.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${tx.status === "completed" || tx.status === "success" ? "text-emerald-500" : "text-amber-500"
                                }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-xl font-black tracking-tighter ${isCredit ? "text-emerald-600" : "text-taja-secondary"
                            }`}>
                            {isCredit ? "+" : "-"}{formatCurrency((tx.amount || 0) / 100)}
                          </p>
                          <button className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-taja-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="glass-panel rounded-[2rem] p-24 text-center border-white/60 border-dashed">
                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-6">
                      <History className="w-8 h-8 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-taja-secondary uppercase tracking-tight">No transactions</h3>
                    <p className="text-[11px] text-gray-400 font-medium">You haven't made any transactions yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-10">
            <div className="glass-card rounded-[3.5rem] p-10 border border-gray-100 shadow-premium bg-white sticky top-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[1.25rem] bg-taja-primary/10 flex items-center justify-center text-taja-primary shadow-inner">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-taja-secondary uppercase tracking-tight">Add Funds</h2>
              </div>
              <p className="text-[11px] font-medium text-gray-400 mb-10 leading-relaxed pr-6">Enter the amount you wish to add to your wallet balance. Your security is our priority.</p>

              <div className="space-y-6">
                <div className="relative group">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 opacity-50">Amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-gray-300">₦</span>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-16 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:border-taja-primary/30 text-lg font-black uppercase tracking-[0.1em] pl-12 pr-6 shadow-inner transition-all"
                    />
                  </div>
                </div>
                <Button
                  className="w-full h-16 rounded-2xl shadow-emerald hover:shadow-emerald-hover text-[12px] font-black uppercase tracking-[0.25em] transition-all group/fund"
                  onClick={handleFund}
                  disabled={funding}
                >
                  {funding ? "Processing..." : "Inject Capital"}
                  <ArrowRight className="ml-3 h-4 w-4 group-hover/fund:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center gap-3 justify-center px-4">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">
                     SECURE CHECKOUT
                   </p>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-taja-secondary text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(46,107,78,0.2),transparent_70%)]" />
              <div className="relative space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-taja-primary" /> Safety & Security
                </h3>
                <p className="text-[11px] font-medium text-white/60 font-medium leading-relaxed">
                  All transactions are encrypted and secure. Funds held in escrow are only released when you are satisfied with your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

