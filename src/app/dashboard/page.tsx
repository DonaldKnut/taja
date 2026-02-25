"use client";

import { useAuth } from "@/contexts/AuthContext";
import { checkoutApi, productsApi } from "@/lib/api";
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
  images?: string[];
  image?: string;
  slug: string;
  shop?: {
    shopName: string;
    isVerified: boolean;
  };
  rating?: number;
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

  return (
    <div className="space-y-8 pb-16">
      {/* ═══ Welcome Hero ═══ */}
      <motion.section
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-taja-secondary via-[#0a3d2e] to-taja-secondary p-6 sm:p-8 lg:p-10"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-taja-primary/15 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 motif-blanc opacity-[0.04]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-emerald-300/70 text-sm font-medium">{greeting},</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {firstName} 👋
              </h1>
              <p className="text-gray-400 text-sm font-medium max-w-md leading-relaxed">
                Here's what's happening with your orders and account today.
              </p>
            </div>

            {/* Stat Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-taja-primary/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-taja-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total Spent</p>
                  <p className="text-lg font-bold text-white leading-none">
                    ₦{stats.totalSpent?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                  <Package className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Orders</p>
                  <p className="text-lg font-bold text-white leading-none">{stats.totalOrders}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-blue-400/20 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">In Transit</p>
                  <p className="text-lg font-bold text-white leading-none">{stats.pendingOrders}</p>
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
            <div className="relative h-full min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 via-taja-primary to-taja-secondary p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-taja-primary/10">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-700" />
                <div className="absolute inset-0 motif-blanc opacity-[0.06]" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/10 text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm w-fit">
                    <ShoppingBag className="h-3 w-3" />
                    Marketplace
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                    Discover Quality Assets
                  </h3>
                  <p className="text-emerald-100/60 text-sm font-medium max-w-sm leading-relaxed">
                    Explore curated listings from verified sellers across the nation.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-white text-sm font-semibold group-hover:gap-3 transition-all mt-6">
                  Start shopping
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Side cards */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-4">
          <Link href="/marketplace" className="group flex-1">
            <div className="h-full p-5 rounded-2xl bg-white border border-gray-100 hover:border-taja-primary/20 hover:shadow-lg hover:shadow-taja-primary/5 transition-all duration-300 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-taja-primary/10 flex items-center justify-center text-taja-primary mb-4 group-hover:scale-110 group-hover:bg-taja-primary group-hover:text-white transition-all duration-300">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-taja-secondary mb-1">Marketplace</h3>
                <p className="text-xs text-gray-400 font-medium">Browse curated products</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/wallet" className="group flex-1">
            <div className="h-full p-5 rounded-2xl bg-white border border-gray-100 hover:border-taja-primary/20 hover:shadow-lg hover:shadow-taja-primary/5 transition-all duration-300 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-taja-secondary/10 flex items-center justify-center text-taja-secondary mb-4 group-hover:scale-110 group-hover:bg-taja-secondary group-hover:text-white transition-all duration-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-taja-secondary mb-1">Wallet</h3>
                <p className="text-xs text-gray-400 font-medium">Manage your payments</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ═══ Recent Orders ═══ */}
      <motion.section custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-taja-secondary">Recent Orders</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Track and manage your purchases</p>
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
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-taja-primary/20 hover:shadow-lg hover:shadow-taja-primary/5 transition-all duration-300">
                      {/* Thumbnail */}
                      <div className="relative aspect-[16/10] bg-gray-50">
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
        <motion.section custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-taja-secondary">Recommended For You</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Products you might love</p>
            </div>
            <Link
              href="/marketplace"
              className="text-xs font-semibold text-taja-primary hover:text-taja-secondary transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendedProducts.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug || product._id}`}
                className="group block"
              >
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-taja-primary/20 hover:shadow-lg hover:shadow-taja-primary/5 transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-square relative bg-gray-50 overflow-hidden">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-sm">
                        <Eye className="h-3.5 w-3.5 text-taja-secondary" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h5 className="text-xs font-semibold text-taja-secondary truncate mb-1">
                      {product.title}
                    </h5>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-taja-primary">
                        ₦{product.price?.toLocaleString()}
                      </p>
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
