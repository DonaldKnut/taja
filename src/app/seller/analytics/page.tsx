"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Star,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Sparkles,
  Activity,
  Target,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sellerApi } from "@/lib/api";

interface AnalyticsData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    reviewCount: number;
    followerCount: number;
    revenueChange: number;
    ordersChange: number;
  };
  charts: {
    revenueByDay: Array<{ date: string; revenue: number }>;
    ordersByDay: Array<{ date: string; orders: number }>;
    topProducts: Array<{ name: string; revenue: number; orders: number; image?: string }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    revenueByPaymentMethod: Array<{ method: string; revenue: number }>;
  };
}

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

const STATUS_DISPLAY: Record<string, { class: string; label: string }> = {
  pending: { class: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Pending" },
  confirmed: { class: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Confirmed" },
  processing: { class: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Processing" },
  shipped: { class: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Shipped" },
  delivered: { class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Delivered" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await sellerApi.getAnalytics(period);
        if (response?.success && response?.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const maxRevenue = data?.charts.revenueByDay.reduce((max, day) => Math.max(max, day.revenue), 0) || 1;
  const maxOrders = data?.charts.ordersByDay.reduce((max, day) => Math.max(max, day.orders), 0) || 1;

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-taja-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-taja-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">Syncing Shop Performance...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-10 py-10"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic">
              Shop <span className="text-taja-primary">Performance</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Tracking <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">your sales activity</span> • Shop Overview
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 glass-card border-white/60 bg-white/20">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${period === p.value
                ? "bg-taja-primary text-white shadow-emerald"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <motion.div variants={item} className="glass-card p-6 border-white/60 hover:shadow-premium transition-all duration-500 group relative overflow-hidden rounded-[32px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            {data.stats.revenueChange !== 0 && (
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${data.stats.revenueChange > 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                {data.stats.revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(data.stats.revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-taja-secondary tracking-tighter group-hover:text-taja-primary transition-colors">
            ₦{data.stats.totalRevenue.toLocaleString()}
          </p>
        </motion.div>

        {/* Total Orders */}
        <motion.div variants={item} className="glass-card p-6 border-white/60 hover:shadow-premium transition-all duration-500 group relative overflow-hidden rounded-[32px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
            {data.stats.ordersChange !== 0 && (
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${data.stats.ordersChange > 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                {data.stats.ordersChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(data.stats.ordersChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-taja-secondary tracking-tighter">{data.stats.totalOrders}</p>
        </motion.div>

        {/* Average Rating */}
        <motion.div variants={item} className="glass-card p-6 border-white/60 hover:shadow-premium transition-all duration-500 group relative overflow-hidden rounded-[32px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <Activity className="h-5 w-5 text-gray-300 animate-pulse" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Store Rating</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-taja-secondary tracking-tighter">{data.stats.averageRating.toFixed(1)}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase">/ 5.0</p>
          </div>
        </motion.div>

        {/* Total Products */}
        <motion.div variants={item} className="glass-card p-6 border-white/60 hover:shadow-premium transition-all duration-500 group relative overflow-hidden rounded-[32px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <Package className="h-6 w-6 text-purple-500" />
            </div>
            <Zap className="h-5 w-5 text-purple-300" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Products Listed</p>
          <p className="text-3xl font-black text-taja-secondary tracking-tighter">{data.stats.totalProducts}</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Revenue Chart */}
        <motion.div variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Revenue Growth</h3>
              <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Sales Trend</p>
            </div>
            <div className="p-4 glass-card border-white/60 bg-emerald-500/5">
              <Activity className="h-6 w-6 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="h-80 flex items-end gap-2">
            {data.charts.revenueByDay.map((day, index) => {
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ duration: 1, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full bg-gradient-to-t from-emerald-500/80 to-emerald-300 rounded-t-lg transition-all hover:scale-x-110 cursor-pointer shadow-premium"
                    title={`${new Date(day.date).toLocaleDateString()}: ₦${day.revenue.toLocaleString()}`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-[8px] font-bold text-gray-400 mt-4 uppercase tracking-widest absolute -bottom-8">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Orders Chart */}
        <motion.div variants={item} className="glass-panel p-10 border-white/60 rounded-[40px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Order Volume</h3>
              <p className="text-2xl font-black text-taja-secondary tracking-tighter italic">Daily Orders</p>
            </div>
            <div className="p-4 glass-card border-white/60 bg-blue-500/5">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="h-80 flex items-end gap-2">
            {data.charts.ordersByDay.map((day, index) => {
              const height = (day.orders / maxOrders) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ duration: 1, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full bg-gradient-to-t from-blue-500/80 to-blue-300 rounded-t-lg transition-all hover:scale-x-110 cursor-pointer shadow-premium"
                    title={`${new Date(day.date).toLocaleDateString()}: ${day.orders} orders`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-[8px] font-bold text-gray-400 mt-4 uppercase tracking-widest absolute -bottom-8">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
        {/* Top Products */}
        <motion.div variants={item} className="lg:col-span-8 glass-panel p-10 border-white/60 rounded-[40px]">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Top Products</h3>
              <p className="text-2xl font-black text-taja-secondary tracking-tighter">Your best sellers</p>
            </div>
            <Sparkles className="h-6 w-6 text-taja-primary" />
          </div>
          <div className="space-y-6">
            {data.charts.topProducts.length === 0 ? (
              <div className="p-20 text-center glass-card border-dashed border-white/60 rounded-[32px]">
                <Package className="h-10 w-10 mx-auto mb-4 text-gray-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Ready • No Sales Data Detected</p>
              </div>
            ) : (
              data.charts.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-6 p-5 glass-card border-white/60 hover:bg-white hover:shadow-premium transition-all duration-300 rounded-[28px] group"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-lg font-black text-taja-secondary border border-white/60 group-hover:bg-taja-primary group-hover:text-white transition-all">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-taja-secondary truncate mb-0.5">{product.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.orders} Deliveries</span>
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">In Stock: 100%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-taja-secondary tracking-tight">₦{product.revenue.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Status & Payment Metrics */}
        <motion.div variants={item} className="lg:col-span-4 space-y-10">
          {/* Orders by Status */}
          <div className="glass-panel p-8 border-white/60 rounded-[40px]">
            <div className="flex items-center gap-3 mb-8">
              <PieChart className="h-5 w-5 text-indigo-500" />
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Order Status</h3>
            </div>
            <div className="space-y-4">
              {data.charts.ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 glass-card border-white/40 rounded-2xl hover:bg-white transition-all">
                  <Badge className={`px-4 py-1 h-auto text-[9px] font-black uppercase tracking-[0.15em] border ${STATUS_DISPLAY[item.status]?.class || "bg-gray-50 text-gray-400 border-gray-100"}`}>
                    {STATUS_DISPLAY[item.status]?.label || item.status}
                  </Badge>
                  <span className="text-sm font-black text-taja-secondary font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Payment Method */}
          <div className="glass-panel p-8 border-white/60 rounded-[40px]">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="h-5 w-5 text-taja-primary" />
              <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Payment Methods</h3>
            </div>
            <div className="space-y-6">
              {data.charts.revenueByPaymentMethod.map((item, index) => {
                const total = data.charts.revenueByPaymentMethod.reduce((sum, m) => sum + m.revenue, 0);
                const percentage = total > 0 ? (item.revenue / total) * 100 : 0;
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {item.method === 'cod' ? 'Cash on Delivery' : item.method.toUpperCase()}
                      </span>
                      <span className="text-sm font-black text-taja-secondary tracking-tight">
                        ₦{item.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-taja-primary h-full rounded-full shadow-emerald"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
