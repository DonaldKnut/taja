"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Eye,
  Star,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Edit,
  MoreVertical,
  Truck,
  Zap,
  Target,
  Shield,
  Sparkles,
  BarChart3,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sellerApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { InventoryAlerts } from "@/components/seller/InventoryAlerts";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  viewsChange: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
  items: number;
}

interface TopProduct {
  id: string;
  name: string;
  image: string | null;
  price: number;
  sales: number;
  revenue: number;
  views: number;
  rating: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalViews: 0,
    revenueChange: 0,
    ordersChange: 0,
    productsChange: 0,
    viewsChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopStatus, setShopStatus] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const kycStatus = user?.kyc?.status;
  const isVerifiedByKyc = kycStatus === "approved";
  const isVerifiedByShop = verificationStatus === "verified";
  const kycPending = kycStatus === "not_started" || kycStatus === "rejected" || !kycStatus || kycStatus === "pending";

  // Once admin has approved either the seller's identity (KYC) or their shop,
  // the seller should not be blocked from adding products.
  const isRestricted = user?.accountStatus === "under_review" || !(isVerifiedByKyc || isVerifiedByShop);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await sellerApi.getDashboard();

        if (response?.success && response?.data) {
          setStats(response.data.stats);
          setRecentOrders(response.data.recentOrders || []);
          setTopProducts(response.data.topProducts || []);
          setShopStatus(response.data.shopStatus ?? null);
          setVerificationStatus(response.data.verificationStatus ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch seller dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          icon: Shield,
          text: "Authorized",
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        };
      case "shipped":
        return {
          icon: Truck,
          text: "Deployed",
          className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        };
      case "processing":
        return {
          icon: Zap,
          text: "Syncing",
          className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        };
      default:
        return {
          icon: Package,
          text: "Protocol",
          className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        };
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating)
          ? "text-amber-400 fill-current"
          : "text-white/10"
          }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-taja-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-taja-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-10 py-10"
    >
      {/* Dashboard Notification Banner if Restricted */}
      {isRestricted && (
        <motion.div
          variants={item}
          className="p-6 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-taja-secondary tracking-tight mb-1">
              {kycPending ? "Identity Verification Required" : "Account Under Final Review"}
            </h3>
            <p className="text-sm text-gray-500 font-medium max-w-2xl">
              {kycPending
                ? "Your merchant identity verification is currently pending. Mission-critical actions like adding new products are restricted until verification is complete."
                : "Your credentials have been submitted. Our specialists are performing a final technical audit of your store configuration."}
            </p>
          </div>
          <Link href={kycPending ? "/onboarding/kyc" : "/seller/setup"}>
            <Button variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-full px-8">
              {kycPending ? "Complete Identity KYC" : "Review Shop Setup"}
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Header & Primary Stats */}
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter">
              Seller <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Dashboard</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Business Overview for <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">{user?.fullName || "Operator"}</span> • Live
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {[
            { label: "Revenue", value: `₦${(stats.totalRevenue ?? 0).toLocaleString()}`, change: stats.revenueChange, icon: DollarSign },
            { label: "Orders", value: stats.totalOrders, change: stats.ordersChange, icon: ShoppingCart },
            { label: "Products", value: stats.totalProducts, change: stats.productsChange, icon: Package },
            { label: "Views", value: (stats.totalViews ?? 0).toLocaleString(), change: stats.viewsChange, icon: Eye },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 border-white/60 min-w-[140px] group hover:border-taja-primary/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em]">{stat.label}</p>
                <stat.icon className="h-3.5 w-3.5 text-gray-300 group-hover:text-taja-primary transition-colors" />
              </div>
              <p className="text-xl font-black text-taja-secondary tracking-tight mb-1">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.change > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-gray-400" />
                )}
                <span className={`text-[10px] font-black ${stat.change > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {stat.change > 0 ? `+${stat.change}%` : 'Stable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Grid: Orders & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Operations (Orders) */}
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.3em]">Recent Orders</h2>
              <div className="h-px w-20 bg-taja-light/30" />
            </div>
            <Link href="/seller/orders" className="text-[10px] font-black text-taja-primary uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="glass-card p-20 border-white/60 text-center border-dashed rounded-[40px]">
                <ShoppingCart className="h-16 w-16 text-taja-light mx-auto mb-6 opacity-40" />
                <h3 className="text-2xl font-black text-taja-secondary tracking-tight mb-4 text-white/80">No Transactions Detected</h3>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Your marketplace interface is waiting for the first commerce pulse.</p>
              </div>
            ) : (
              recentOrders.map((order) => {
                const status = getStatusDisplay(order.status);
                return (
                  <Link key={order.id} href={`/seller/orders/${order.id}`} className="group block">
                    <div className="glass-card px-8 py-5 border-white/60 hover:shadow-premium transition-all duration-300 flex items-center gap-6 rounded-[32px]">
                      <div className="w-12 h-12 rounded-2xl bg-taja-primary/5 flex items-center justify-center text-taja-primary border border-taja-primary/10 shrink-0 group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                        <status.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-taja-primary uppercase tracking-[0.2em] mb-1">
                          Ref: {order.orderNumber}
                        </p>
                        <h4 className="text-sm font-black text-taja-secondary truncate">{order.customer}</h4>
                      </div>
                      <div className="hidden md:block">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${status.className}`}>
                          {status.text}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-taja-secondary tracking-tight">₦{(order.total ?? 0).toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-gray-400 font-mono">{order.date}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-taja-primary transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* High Performance Assets (Top Products) */}
        <motion.div variants={item} className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-taja-primary uppercase tracking-[0.3em]">Top Products</h2>
            <div className="h-px flex-1 bg-taja-light/30" />
          </div>

          <div className="glass-card p-8 border-white/60 rounded-[40px] space-y-6">
            {topProducts.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <Package className="h-12 w-12 mx-auto mb-4 text-taja-light" />
                <p className="text-xs font-black uppercase tracking-widest text-taja-secondary">Zero Catalog</p>
              </div>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 group">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-motif-blanc border border-white/40 shrink-0">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <Package className="h-6 w-6 text-taja-light m-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-taja-secondary truncate mb-1">{product.name}</h4>
                    <div className="flex items-center gap-1.5 mb-2">
                      {renderStars(product.rating)}
                      <span className="text-[9px] font-black text-gray-400">{product.rating}</span>
                    </div>
                    <p className="text-[9px] font-black text-taja-primary uppercase tracking-widest">{product.sales} Deployments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-taja-secondary tracking-tight">₦{(product.revenue ?? 0).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-gray-400">Yield</p>
                  </div>
                </div>
              ))
            )}

            <div className="pt-6 border-t border-white/10">
              <Link href="/seller/products">
                <Button variant="outline" className="w-full rounded-2xl border-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-taja-secondary transition-all">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* AI Inventory Alerts */}
        <motion.div variants={item}>
          <InventoryAlerts maxAlerts={5} />
        </motion.div>
      </div>

      {/* Tactical Actions Grid */}
      <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "New Product", desc: "List a new product in your shop", icon: Plus, link: "/seller/products/new", color: "bg-emerald-500", disabled: isRestricted },
          { title: "Product List", desc: "Manage your existing inventory", icon: Package, link: "/seller/products", color: "bg-blue-500" },
          { title: "Shipping", desc: "Track and manage order shipments", icon: Truck, link: "/seller/logistics", color: "bg-amber-500" },
          { title: "Statistics", desc: "Detailed business growth analytics", icon: TrendingUp, link: "/seller/analytics", color: "bg-purple-500" },
        ].map((action, i) => (
          <Link key={i} href={action.disabled ? "#" : action.link} className={action.disabled ? "cursor-not-allowed opacity-50" : "group"}>
            <div className={`glass-card p-8 border-white/60 h-full transition-all duration-500 flex flex-col items-start ${!action.disabled && 'hover:border-taja-primary/40 hover:shadow-premium hover:-translate-y-1'}`}>
              <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-taja-secondary tracking-tight mb-2">{action.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium mb-8 flex-1">{action.desc}</p>
              {!action.disabled && (
                <div className="flex items-center text-[10px] font-black text-taja-primary uppercase tracking-widest gap-2">
                  Open Page <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
