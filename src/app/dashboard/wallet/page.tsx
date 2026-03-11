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
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-black text-taja-secondary tracking-tight leading-tight">
              Your Taja wallet
            </h1>
            <p className="text-sm text-gray-500 max-w-md">
              Add money, see what&apos;s available to spend, and track money held in escrow for active orders.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="group relative flex items-center justify-center px-10 h-14 bg-taja-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-emerald hover:shadow-emerald-hover transition-all active:scale-95 overflow-hidden"
              onClick={handleFund}
              disabled={funding}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {funding ? "Synching..." : "Inject Capital"}
            </button>
          </div>
        </div>

        {/* Reward points (earned from purchases) */}
        {points !== null && (
          <div className="rounded-2xl border border-taja-primary/20 bg-taja-light/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-taja-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-taja-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-taja-secondary">Reward points</p>
                  <p className="text-xs text-gray-500">
                    You earn points each time you confirm delivery. We give 1 point for every ₦100 you spend.
                  </p>
                </div>
              </div>
            <p className="text-2xl font-black text-taja-primary tabular-nums">{points.toLocaleString()} pts</p>
          </div>
        )}

        {/* Balance Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative group overflow-hidden rounded-[3rem] shadow-premium"
          >
            {/* Dynamic Glass Surface */}
            <div className="absolute inset-0 bg-taja-secondary transition-all duration-700 group-hover:bg-[#151515]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,107,78,0.3),transparent_70%)]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-taja-primary/10 blur-[120px] rounded-full" />

            <div className="relative p-12 text-white flex flex-col h-full">
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-inner">
                    <Wallet className="w-6 h-6 text-taja-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Available balance</h3>
                    <p className="text-xs font-bold text-white/80">Money you can spend right now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Total Balance</p>
                    <div className="flex items-baseline gap-4">
                      <span className="text-5xl md:text-7xl font-black tracking-tighter tabular-nums decoration-taja-primary/30 underline underline-offset-[12px] md:underline-offset-[20px]">
                        {formatCurrency(balance?.available?.naira ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="h-12 w-12 rounded-full bg-white text-taja-secondary flex items-center justify-center shadow-lg hover:bg-taja-primary hover:text-white transition-all transform hover:-translate-y-1">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                    <button className="h-12 rounded-full px-8 bg-white/10 backdrop-blur-lg border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all" onClick={refresh}>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group overflow-hidden rounded-[3rem] bg-white border border-gray-100 shadow-premium p-10 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Held in Escrow</h3>
                <p className="text-3xl font-black text-taja-secondary tracking-tight">{formatCurrency(balance?.held?.naira ?? 0)}</p>
              </div>
              <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                Funds held securely until you confirm delivery of your orders.
              </p>
            </div>

            <div className="pt-8 border-t border-gray-50">
              <button className="w-full h-12 rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                View History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-taja-secondary/5 flex items-center justify-center text-taja-secondary">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-taja-secondary uppercase tracking-widest">Transaction History</h2>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-taja-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 h-12 rounded-full bg-white border border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-0 focus:border-taja-primary/30 transition-all w-64 shadow-sm"
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

          <div className="space-y-8">
            <div className="glass-card rounded-[3rem] p-10 border-white/60 shadow-premium bg-white/50 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-taja-primary/10 flex items-center justify-center text-taja-primary">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-taja-secondary uppercase tracking-tight">Add Funds</h2>
              </div>
              <p className="text-[10px] font-medium text-gray-400 mb-8 leading-relaxed">Enter the amount you wish to add to your wallet balance.</p>

              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1">Amount (₦)</label>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-xs font-black uppercase tracking-[0.2em] px-6"
                  />
                </div>
                <Button
                  className="w-full h-14 rounded-2xl shadow-premium text-[11px] font-black uppercase tracking-[0.2em]"
                  onClick={handleFund}
                  disabled={funding}
                >
                  {funding ? "Processing..." : "Add Funds"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 text-center leading-relaxed px-4">
                  Secure payment via Paystack. Funds will be added instantly after payment.
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border-white/60">
              <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-taja-primary" /> Safety & Security
              </h3>
              <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                All transactions are secure. Funds held in escrow are released safely when you confirm delivery of your orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

