"use client";

import { useAuth } from "@/contexts/AuthContext";
import { checkoutApi, productsApi } from "@/lib/api";
import { getProductDisplayPriceRange } from "@/lib/productPricing";
import { ProductPrice } from "@/components/product/ProductPrice";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Grid3x3,
  Image as ImageIcon,
  List as ListIcon,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  CreditCard,
  Zap,
  Star,
  Sparkles,
  ChevronRight,
  Eye,
  Wallet,
  Heart,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface Order {
  _id: string;
  orderNumber?: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    product?: {
      name?: string;
      title?: string;
      images?: string[];
      image?: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  maxPrice?: number;
  images?: string[];
  image?: string;
  slug: string;
  shop?: {
    _id?: string;
    shopName: string;
    isVerified: boolean;
  };
  seller?: string | { _id: string; fullName: string; avatar?: string };
  rating?: number;
  variants?: any[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardViewMode");
      return saved === "grid" || saved === "list" ? saved : "grid";
    }
    return "grid";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardViewMode", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "seller") {
      router.replace("/seller/dashboard");
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        });

        try {
          const ordersResponse = (await Promise.race([
            checkoutApi.getOrders({ page: 1, limit: 5 }),
            timeoutPromise,
          ])) as any;
          const orders = ordersResponse?.data?.orders || [];
          setRecentOrders(orders);

          try {
            const allOrdersResponse = (await Promise.race([
              checkoutApi.getOrders({ page: 1, limit: 100 }),
              timeoutPromise,
            ])) as any;
            const allOrders = allOrdersResponse?.data?.orders || [];
            const totalOrders = allOrders.length;
            const pendingOrders = allOrders.filter((o: Order) =>
              ["pending", "processing", "shipped"].includes(o.status)
            ).length;
            const totalSpent = allOrders
              .filter((o: Order) => o.status === "delivered")
              .reduce((sum: number, o: Order) => sum + (o.total || 0), 0);

            setStats({ totalOrders, pendingOrders, totalSpent });
          } catch (err) {
            setStats({
              totalOrders: orders.length,
              pendingOrders: orders.filter((o: Order) =>
                ["pending", "processing", "shipped"].includes(o.status)
              ).length,
              totalSpent: 0,
            });
          }
        } catch (error) {
          setRecentOrders([]);
          setStats({ totalOrders: 0, pendingOrders: 0, totalSpent: 0 });
        }

        try {
          const productsResponse = (await Promise.race([
            productsApi.getFeatured(6),
            timeoutPromise,
          ])) as any;
          const products =
            productsResponse?.data?.products || productsResponse?.data || [];
          setRecommendedProducts(products.slice(0, 6));
        } catch (error) {
          try {
            const productsResponse = (await Promise.race([
              productsApi.getAll({ page: 1, limit: 6 }),
              timeoutPromise,
            ])) as any;
            const products =
              productsResponse?.data?.products ||
              productsResponse?.data ||
              [];
            setRecommendedProducts(products.slice(0, 6));
          } catch (err) {
            setRecommendedProducts([]);
          }
        }
      } catch (error) {
        setRecentOrders([]);
        setRecommendedProducts([]);
        setStats({ totalOrders: 0, pendingOrders: 0, totalSpent: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return {
          icon: CheckCircle,
          text: "Delivered",
          className: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "shipped":
      case "in_transit":
        return {
          icon: Truck,
          text: "Shipped",
          className: "bg-blue-50 text-blue-600 border-blue-100",
        };
      case "pending":
      case "processing":
        return {
          icon: Clock,
          text: "Processing",
          className: "bg-amber-50 text-amber-600 border-amber-100",
        };
      default:
        return {
          icon: Package,
          text: "Confirmed",
          className: "bg-gray-50 text-gray-500 border-gray-100",
        };
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-[3px] border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-taja-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const greetingsSub = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Ready to find something amazing this morning?";
    if (h < 17) return "How is your shopping experience going?";
    return "Wrapping up your day with some retail therapy?";
  })();

  return (
    <div className="space-y-8 pb-16">
      {/* ═══ Welcome Hero ═══ */}
      <motion.section
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] p-8 sm:p-10 lg:p-12 border border-emerald-900/50 shadow-2xl"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-taja-primary/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 motif-blanc opacity-[0.03]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-950/40" />
        </div>

        <div className="relative z-10 px-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-taja-primary rounded-full" />
                <p className="text-taja-primary text-[10px] font-black uppercase tracking-[0.3em]">{greeting}</p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none italic">
                Your Shopping Summary, {firstName}
              </h1>
              <p className="text-emerald-100/60 text-sm font-medium max-w-md leading-relaxed">
                {greetingsSub} Here is a quick look at your Taja activity and orders.
              </p>
            </div>

            {/* Stat Bento Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-[600px]">
              {/* Total Spent */}
              <div className="group relative p-6 rounded-3xl bg-emerald-950/50 border border-emerald-900/50 hover:border-taja-primary/30 transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-taja-primary/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute inset-0 motif-blanc opacity-[0.02]" />
                </div>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="h-12 w-12 text-taja-primary" />
                </div>
                <div className="relative z-10">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Total Spend</p>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    ₦{stats.totalSpent?.toLocaleString() || "0"}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="h-1 w-8 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-taja-primary shadow-[0_0_8px_rgba(255,42,109,0.5)]"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-taja-primary uppercase">Shopping</span>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="group relative p-6 rounded-3xl bg-emerald-950/50 border border-emerald-900/50 hover:border-amber-500/30 transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute inset-0 motif-blanc opacity-[0.02]" />
                </div>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShoppingBag className="h-12 w-12 text-amber-500" />
                </div>
                <div className="relative z-10">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Total Orders</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{stats.totalOrders}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Order History</span>
                  </div>
                </div>
              </div>

              {/* In Transit */}
              <div className="group relative p-6 rounded-3xl bg-emerald-950/50 border border-emerald-900/50 hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute inset-0 motif-blanc opacity-[0.02]" />
                </div>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="h-12 w-12 text-blue-500" />
                </div>
                <div className="relative z-10">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">On The Way</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{stats.pendingOrders}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-blue-500">
                    <Truck className="h-3 w-3 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Track Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Quick Actions Bento ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marketplace — Quick Access */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="md:col-span-2">
          <Link href="/dashboard/marketplace" className="group block h-full">
            <div className="relative h-full min-h-[240px] rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#024037] to-[#012d27] p-8 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 border border-emerald-900/30">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-700" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-taja-primary/5 rounded-full blur-[60px]" />
                <div className="absolute inset-0 motif-blanc opacity-[0.04]" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-sm w-fit">
                    <Sparkles className="h-3 w-3" />
                    Featured Collections
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight italic">
                    Shop Premium<br />African Products
                  </h3>
                  <p className="text-emerald-100/60 text-sm font-medium max-w-sm leading-relaxed">
                    Explore our curated marketplace of verified high-quality products from across the continent.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-white text-sm font-black uppercase tracking-widest group-hover:gap-4 transition-all mt-8 italic">
                  Start Shopping
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Side cards */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <Link href="/marketplace" className="group h-full">
            <div className="h-full p-6 rounded-[2rem] bg-gradient-to-br from-[#024037] to-[#012d27] border border-emerald-900/30 hover:border-taja-primary/30 hover:shadow-xl hover:shadow-taja-primary/5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-taja-primary/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute inset-0 motif-blanc opacity-[0.02]" />
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <ShoppingBag className="h-16 w-16 text-taja-primary" />
              </div>
              <div className="h-12 w-12 rounded-2xl bg-taja-primary/10 flex items-center justify-center text-taja-primary mb-4 group-hover:scale-110 group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                <Grid3x3 className="h-6 w-6" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1 uppercase">Categories</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Browse Everything</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/wallet" className="group h-full">
            <div className="h-full p-6 rounded-[2rem] bg-emerald-950/40 border border-emerald-900/30 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <CreditCard className="h-16 w-16 text-blue-400" />
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1 uppercase">My Wallet</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manage Your Funds</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ═══ Recent Orders ═══ */}
      <motion.section custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-taja-primary rounded-full" />
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">My Orders</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Track your recent purchases and delivery status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-white text-taja-primary shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list"
                  ? "bg-white text-taja-primary shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            {recentOrders.length > 0 && (
              <Link
                href="/dashboard/orders"
                className="text-xs font-semibold text-taja-primary hover:text-taja-secondary transition-colors flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center bg-white">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-taja-secondary mb-2">No orders yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Start shopping to see your orders here. We have thousands of products waiting for you!
            </p>
            <Link href="/marketplace">
              <Button className="bg-taja-primary text-white rounded-xl px-6 h-10 text-sm font-semibold shadow-emerald hover:shadow-emerald-hover transition-all">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {recentOrders.map((order) => {
                const status = getStatusDisplay(order.status);
                const StatusIcon = status.icon;
                const firstItem = order.items?.[0]?.product;
                const orderImg = firstItem?.images?.[0] || firstItem?.image;
                const orderTitle =
                  firstItem?.name || firstItem?.title || "Order";

                return viewMode === "grid" ? (
                  <Link
                    key={order._id}
                    href={`/dashboard/orders/${order._id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:border-taja-primary/30 hover:shadow-2xl hover:shadow-taja-primary/5 transition-all duration-500">
                      {/* Thumbnail */}
                      <div className="relative aspect-[16/10] bg-slate-50">
                        {orderImg ? (
                          <Image
                            src={orderImg}
                            alt={orderTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-10 w-10 text-gray-200" />
                          </div>
                        )}
                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${status.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.text}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            </p>
                            <h4 className="text-sm font-bold text-taja-secondary truncate mt-0.5">
                              {orderTitle}
                            </h4>
                          </div>
                          <p className="text-sm font-bold text-taja-secondary whitespace-nowrap">
                            ₦{order.total?.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                          <p className="text-[11px] text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-taja-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  /* List view */
                  <Link
                    key={order._id}
                    href={`/dashboard/orders/${order._id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-xl border border-gray-100 hover:border-taja-primary/20 hover:shadow-md transition-all duration-200 p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                        {orderImg ? (
                          <Image
                            src={orderImg}
                            alt={orderTitle}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-200" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center min-w-0">
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                          </p>
                          <h4 className="text-sm font-bold text-taja-secondary truncate">
                            {orderTitle}
                          </h4>
                        </div>

                        <div className="hidden sm:block">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${status.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.text}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-taja-secondary">
                            ₦{order.total?.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 group-hover:text-taja-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.section>

      {/* ═══ Recommended For You ═══ */}
      {recommendedProducts.length > 0 && (
        <motion.section custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-indigo-500 rounded-full" />
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Picked For You</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Products we think you&apos;ll love based on your style</p>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="text-xs font-semibold text-taja-primary hover:text-taja-secondary transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {recommendedProducts.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug || product._id}`}
                className="group block"
              >
                <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 h-full flex flex-col">
                  <div className="aspect-square relative bg-slate-50 overflow-hidden">
                    {product.images?.[0] || product.image ? (
                      <Image
                        src={product.images?.[0] || product.image || ""}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-200" />
                      </div>
                    )}
                    {/* Quick view overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-sm border border-gray-100">
                        <Eye className="h-3.5 w-3.5 text-taja-secondary" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sellerId = typeof product.seller === 'object' ? product.seller?._id : product.seller;
                          if (sellerId) {
                            window.location.href = `/chat?seller=${sellerId}&product=${product._id}&shopId=${product.shop?._id || ""}`;
                          }
                        }}
                        className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-sm border border-gray-100 text-emerald-600 hover:bg-emerald-50"
                        title="Chat with seller"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                    <h5 className="text-xs font-semibold text-taja-secondary truncate mb-1">
                      {product.title}
                    </h5>
                    <div className="flex items-center justify-between">
                      <ProductPrice
                        price={getProductDisplayPriceRange(product as any).minPrice}
                        maxPrice={getProductDisplayPriceRange(product as any).maxPrice}
                        hasVariants={Array.isArray((product as any).variants) && (product as any).variants.length > 0}
                        size="sm"
                        className="text-taja-primary"
                        showCompare={false}
                      />
                      {product.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] text-gray-400 font-medium">{product.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
