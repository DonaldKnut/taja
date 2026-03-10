"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Copy,
  MessageSquare,
  Star,
  AlertCircle,
  Download,
  Printer,
  XCircle,
  CreditCard,
  Receipt,
  Calendar,
  User,
  Store,
  Mail,
  FileText,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Zap,
  ChevronRight,
  Info,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

// Narrative timeline status map
const narrativeStatus = {
  pending: {
    label: "Order Secured",
    description: "Transaction initialized and funds held in Taja Escrow.",
    icon: Lock,
    color: "emerald",
  },
  confirmed: {
    label: "Seller Acknowledged",
    description: "The seller has confirmed receipt and is preparing the item.",
    icon: Store,
    color: "blue",
  },
  processing: {
    label: "Quality Audit",
    description: "Items are being inspected and packaged for secure transit.",
    icon: Package,
    color: "purple",
  },
  shipped: {
    label: "In Transit",
    description: "Your package is moving through our logistics network.",
    icon: Truck,
    color: "orange",
  },
  delivered: {
    label: "Delivered",
    description: "Package received. Awaiting buyer confirmation for escrow release.",
    icon: CheckCircle,
    color: "green",
  },
  cancelled: {
    label: "Voided",
    description: "Transaction cancelled. Funds returned to original payment source.",
    icon: XCircle,
    color: "red",
  },
  refunded: {
    label: "Refunded",
    description: "Funds have been successfully reversed to your account.",
    icon: RefreshCw,
    color: "gray",
  },
};

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    images: string[];
    price: number;
    slug?: string;
  };
  title: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface DeliveryInfo {
  method?: "pickup" | "delivery";
  provider?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date | string;
  actualDelivery?: Date | string;
  deliveryFee?: number;
  currentLocation?: string;
  status?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  buyer: {
    _id: string;
    fullName: string;
    email?: string;
    phone: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    fullName: string;
    email?: string;
    phone: string;
    avatar?: string;
  };
  shop: {
    _id: string;
    shopName: string;
    shopSlug: string;
    logo?: string;
  };
  items: OrderItem[];
  status: keyof typeof narrativeStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "escrowed";
  paymentMethod?: string;
  paymentReference?: string;
  escrowStatus?: "pending" | "funded" | "released" | "refunded";
  escrowReference?: string;
  totals: {
    subtotal: number;
    shipping?: number;
    shippingCost?: number;
    tax: number;
    discount: number;
    total: number;
  };
  shippingAddress: {
    fullName?: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  delivery: DeliveryInfo;
  timeline: Array<{
    status: string;
    timestamp: Date | string;
    note?: string;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [releasingEscrow, setReleasingEscrow] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api(`/api/orders/${params.id}`);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        toast.error("Order not found");
        router.push("/dashboard/orders");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast.error(error.message || "Failed to load order");
      router.push("/dashboard/orders");
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
    toast.success("Order refreshed");
  };

  const confirmDeliveryAndRelease = async () => {
    if (!order) return;
    setConfirmingDelivery(true);
    try {
      await api(`/api/orders/${order._id}/confirm-delivery`, { method: "POST" });
      toast.success("Delivery confirmed. Releasing escrow...");
      setReleasingEscrow(true);
      await api("/api/payments/payout", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id, provider: "auto" }),
      });
      toast.success("Escrow released successfully!");
      await fetchOrder();
    } catch (error: any) {
      toast.error(error?.message || "Failed to confirm delivery");
      await fetchOrder();
    } finally {
      setReleasingEscrow(false);
      setConfirmingDelivery(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-10 w-10 animate-spin text-taja-primary mb-4" />
        <p className="text-gray-500 font-medium font-luxury">Retrieving your order details...</p>
      </div>
    );
  }

  if (!order) return null;

  const currentNarrative = narrativeStatus[order.status] || narrativeStatus.pending;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-taja-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-taja-secondary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-8">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                <Link href="/dashboard" className="hover:text-taja-primary">Hub</Link>
                <ChevronRight className="h-2.5 w-2.5" />
                <Link href="/dashboard/orders" className="hover:text-taja-primary">Orders</Link>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="text-taja-secondary">Track</span>
              </nav>
              <h1 className="text-2xl font-black text-taja-secondary tracking-tight">
                Order <span className="text-taja-primary">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshOrder}
              disabled={refreshing}
              className="rounded-full bg-white font-bold text-[10px] uppercase tracking-wider"
            >
              <RefreshCw className={cn("h-3 w-3 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="rounded-full bg-white font-bold text-[10px] uppercase tracking-wider hidden sm:flex"
            >
              <Printer className="h-3 w-3 mr-2" />
              Receipt
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Status Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Premium Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2.5rem] p-1 bg-gradient-to-br from-taja-secondary via-taja-secondary to-black shadow-2xl"
            >
              {/* Animated Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/20 blur-[80px] -mr-32 -mt-32 rounded-full animate-pulse" />

              <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.4rem] p-8 md:p-10 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Escrow Secured Transaction</span>
                    </div>

                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
                        {currentNarrative.label}
                      </h2>
                      <p className="text-gray-400 font-medium max-w-sm">
                        {currentNarrative.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Current Destination</p>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <MapPin className="w-4 h-4 text-taja-primary" />
                          <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                        </div>
                      </div>

                      <div className="w-px h-8 bg-white/10" />

                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Est. Delivery</p>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <Truck className="w-4 h-4 text-taja-primary" />
                          <span>{order.delivery?.estimatedDelivery ? new Date(order.delivery.estimatedDelivery).toLocaleDateString() : 'Awaiting dispatch'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 px-8 py-6 rounded-3xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                      {formatCurrency(order.totals.total)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-taja-primary/10 rounded-full">
                      <Zap className="w-3 h-3 text-taja-primary fill-taja-primary" />
                      <span className="text-[9px] font-black text-taja-primary uppercase">Elite Protection Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Narrative Timeline */}
            <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-taja-secondary tracking-tight">Narrative Tracking</CardTitle>
                  <Badge variant="outline" className="rounded-full border-gray-100 text-[10px] font-bold uppercase tracking-wider px-3">
                    <RefreshCw className="w-2.5 h-2.5 mr-1.5 text-taja-primary" />
                    Live Updates
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="relative mt-8">
                  {/* Connection Line */}
                  <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-taja-primary/40 via-gray-100 to-gray-50" />

                  <div className="space-y-10">
                    {[...(order.timeline || [])].reverse().map((event, index) => {
                      const config = narrativeStatus[event.status as keyof typeof narrativeStatus] || narrativeStatus.pending;
                      const isFirst = index === 0;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex gap-6"
                        >
                          <div className={cn(
                            "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform",
                            isFirst ? "bg-taja-secondary text-white scale-110 shadow-taja-primary/20" : "bg-white text-gray-400 border border-gray-100"
                          )}>
                            <config.icon className={cn("w-5 h-5", isFirst && "text-taja-primary")} />
                          </div>

                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={cn(
                                "text-sm font-black tracking-tight",
                                isFirst ? "text-taja-secondary" : "text-gray-400"
                              )}>
                                {config.label}
                              </h4>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(event.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm leading-relaxed",
                              isFirst ? "text-gray-600 font-medium" : "text-gray-400"
                            )}>
                              {event.note || config.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Grid */}
            <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight">Order Architecture</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="group relative flex items-center gap-6 p-4 rounded-3xl border border-gray-50 hover:bg-gray-50/50 hover:border-gray-100 transition-all duration-300">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                        <Image
                          src={item.image || "/placeholder-product.jpg"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-base font-black text-taja-secondary tracking-tight group-hover:text-taja-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                              Quantity {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-taja-secondary tracking-tight">
                              {formatCurrency(item.subtotal || item.price * item.quantity)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <Link href={`/product/${item.product?.slug || item.product?._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white border border-transparent hover:border-gray-100">
                              View Asset <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - Financials & logistics */}
          <div className="lg:col-span-4 space-y-6">

            {/* Escrow Protection Badge */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Lock className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight">Escrow Protected</h4>
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Funds Secured</p>
                </div>
              </div>
              <p className="text-sm text-emerald-50/80 leading-relaxed mb-6">
                Taja Hub is holding your payment of <strong>{formatCurrency(order.totals.total)}</strong> in a secure escrow account.
                Funds are released to the seller when you confirm delivery, or automatically if you don&apos;t confirm or report a problem within 7 days of delivery.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Payment Verified</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Seller Identity Confirmed</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold opacity-60">
                  <Clock className="w-4 h-4 text-white" />
                  <span>Awaiting Release</span>
                </div>
              </div>
            </div>

            {/* Order Ledger */}
            <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight">Financial Ledger</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Subtotal</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Shipping Logistics</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.shipping || order.totals.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">VAT (7.5%)</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.tax)}</span>
                  </div>
                  <div className="h-px bg-gray-50 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-taja-secondary tracking-tight">Total Settlement</span>
                    <span className="text-2xl font-black text-taja-primary tracking-tighter">{formatCurrency(order.totals.total)}</span>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Intelligence</p>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-taja-primary" />
                        </div>
                        <div className="text-[11px] font-bold text-taja-secondary uppercase tracking-tight">
                          Paystack Protocol
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PAID
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller & Shop */}
            <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight">Merchant Identity</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <Image
                      src={order.shop.logo || order.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.shop.shopName)}&background=111827&color=fff`}
                      alt={order.shop.shopName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-taja-secondary tracking-tight">{order.shop.shopName}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      {order.seller.avatar && (
                        <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden">
                          <Image src={order.seller.avatar} alt={order.seller.fullName} fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.seller.fullName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/chat?seller=${order.seller._id}&order=${order._id}`} className="block">
                    <Button className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5 mr-2" />
                      Secure Channel
                    </Button>
                  </Link>
                  {order.seller.phone && (
                    <a
                      href={`https://wa.me/${order.seller.phone.replace(/[\s\+\-]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                        <Phone className="w-3.5 h-3.5 mr-2" />
                        WhatsApp Seller
                      </Button>
                    </a>
                  )}
                  <Link href={`/shop/${order.shop.shopSlug}`} className="block">
                    <Button variant="ghost" className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-taja-primary">
                      <Store className="w-3.5 h-3.5 mr-2" />
                      Visit Shop
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Destination */}
            <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight">Secure Logistics</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="p-5 rounded-3xl bg-gray-50/50 border border-gray-50">
                  <div className="flex items-center gap-3 mb-4 text-taja-secondary">
                    {order.buyer.avatar ? (
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-taja-primary/20">
                        <Image src={order.buyer.avatar} alt={order.buyer.fullName} fill className="object-cover" />
                      </div>
                    ) : (
                      <MapPin className="w-5 h-5 text-taja-primary" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">Courier Endpoint</span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="font-black text-taja-secondary">{order.shippingAddress.fullName || order.buyer.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">Verified Destination</p>
                  </div>
                </div>

                {order.paymentStatus === "paid" && order.status !== "delivered" && (
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <Button
                      className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg"
                      onClick={confirmDeliveryAndRelease}
                      disabled={confirmingDelivery || releasingEscrow}
                    >
                      {confirmingDelivery ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {releasingEscrow ? 'Finalizing Release...' : 'Confirm Delivery'}
                    </Button>
                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                      Only click if you have received your package
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Actions */}
            <div className="flex flex-col gap-2 px-6">
              <Link href={`/support?orderId=${order._id}`} className="text-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" />
                  Report a Transaction Issue
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encrypted Hub Protocol
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

