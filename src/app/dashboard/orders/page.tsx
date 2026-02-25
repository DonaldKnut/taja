"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { checkoutApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  status:
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "escrowed";
  total: number;
  date: string;
  estimatedDelivery?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    seller: {
      name: string;
      shop: string;
    };
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await checkoutApi.getOrders({
          page: 1,
          limit: 100,
          role: "buyer",
          ...(statusFilter !== "all" && { status: statusFilter }),
        });

        if (response?.success && response?.data?.orders) {
          const mappedOrders: Order[] = response.data.orders.map((order: any) => ({
            id: order._id,
            orderNumber: order.orderNumber || `TJA-${order._id.slice(-8).toUpperCase()}`,
            status: order.status || "pending",
            paymentStatus: order.paymentStatus || "pending",
            total: order.totals?.total || order.total || 0,
            date: order.createdAt || new Date().toISOString(),
            estimatedDelivery: order.delivery?.estimatedDelivery
              ? new Date(order.delivery.estimatedDelivery).toISOString()
              : undefined,
            items: order.items?.map((item: any, index: number) => ({
              id: item.product?._id || item.product || `${order._id}-${index}`,
              name: item.title || item.product?.title || item.product?.name || "Product",
              quantity: item.quantity || 1,
              price: item.price || 0,
              image: item.image || item.product?.images?.[0] || item.product?.image || "/placeholder-product.jpg",
              seller: {
                name: order.seller?.fullName || "Unknown Seller",
                shop: order.shop?.shopName || "Unknown Shop",
              },
            })) || [],
            shippingAddress: {
              street: order.shippingAddress?.addressLine1 || order.shippingAddress?.street || "",
              city: order.shippingAddress?.city || "",
              state: order.shippingAddress?.state || "",
              postalCode: order.shippingAddress?.postalCode || "",
            },
          }));

          setOrders(mappedOrders);
        } else {
          setOrders([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to load orders. Please try again.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user, statusFilter]);

  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (dateRangeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRangeFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= filterDate;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "highest":
          return b.total - a.total;
        case "lowest":
          return a.total - b.total;
        default:
          return dateB - dateA;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateRangeFilter, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "shipped":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "processing":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "refunded":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-taja-primary/10 border border-taja-primary/20">
            <Package className="h-3 w-3 text-taja-primary" />
            <span className="text-[9px] font-black text-taja-primary uppercase tracking-[0.4em]">Operational History Feed</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter leading-none">
            Mission <br /> <span className="text-taja-primary">Deployment Log.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
            <Input
              placeholder="Search Deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-white/60 bg-white/30 backdrop-blur-md focus:bg-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-gray-400/50"
            />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-2 rounded-[2rem] border-white/60 shadow-premium bg-white/50 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Status Select */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Date Select */}
          <div className="relative">
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="all">Date Range</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last Quarter</option>
            </select>
          </div>

          {/* Sort Select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Price</option>
              <option value="lowest">Lowest Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Inventory */}
      <div className="space-y-6 min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card animate-pulse rounded-[2rem] p-8 border-white/60 h-48" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="group glass-card rounded-[2.5rem] p-8 border-white/60 shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl -z-10 group-hover:bg-taja-primary/10 transition-colors" />

                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl border ${getStatusStyle(order.status)} shrink-0`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-taja-secondary tracking-tight flex items-center gap-2">
                        {order.orderNumber}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-taja-primary" />
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Ordered on {new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-taja-secondary/5 border border-taja-secondary/10 text-taja-secondary text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {order.paymentStatus}
                    </div>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full border-white/60 text-[9px] h-9">
                        <Eye className="w-3.5 h-3.5 mr-2" /> View
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/30 p-3 rounded-2xl border border-white/40">
                        <div className="flex-shrink-0 relative h-14 w-14 rounded-xl overflow-hidden shadow-sm">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-taja-secondary truncate uppercase tracking-wide">
                            {item.name}
                          </h4>
                          <p className="text-[10px] font-bold text-taja-primary mt-0.5">
                            {item.quantity} UNIT{item.quantity > 1 ? 'S' : ''} • ₦{item.price.toLocaleString()}
                          </p>
                          <p className="text-[9px] font-medium text-gray-400">
                            {item.seller.shop}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Section */}
                  <div className="lg:pl-8 lg:border-l border-gray-100 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                          <p className="text-3xl font-black text-taja-secondary tracking-tighter">
                            ₦{order.total.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                          <p className="text-xs font-bold text-taja-secondary">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </p>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                            {order.shippingAddress.street}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      {order.status === "delivered" && (
                        <Button size="sm" variant="outline" className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest">
                          Review Items
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Link href={`/track/${order.orderNumber}`}>
                          <Button size="sm" variant="outline" className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest bg-taja-primary text-white border-none shadow-emerald">
                            Track Order
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full rounded-full h-10 px-8 text-[10px] font-black uppercase tracking-widest shadow-premium">
                          Order Details
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-[3rem] p-24 text-center border-white/60 border-dashed"
          >
            <div className="max-w-md mx-auto space-y-8">
              <div className="h-24 w-24 rounded-[2rem] bg-taja-light/30 flex items-center justify-center mx-auto mb-6 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-inner">
                <Package className="w-10 h-10 text-taja-primary opacity-40" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-taja-secondary tracking-tight">No orders found</h3>
                <p className="text-gray-400 font-medium text-base">You haven't placed any orders yet. Start shopping to find amazing pieces.</p>
              </div>
              {!searchTerm && statusFilter === "all" && (
                <div className="pt-4">
                  <Link href="/dashboard/marketplace">
                    <Button size="lg" className="rounded-full px-12 h-16 shadow-emerald hover:shadow-emerald-hover transition-all text-[11px] font-black uppercase tracking-[0.2em] transform hover:-translate-y-1">
                      Start Shopping
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


