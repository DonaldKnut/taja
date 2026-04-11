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
  AlertCircle,
  Printer,
  XCircle,
  CreditCard,
  Receipt,
  Calendar,
  User,
  Store,
  Mail,
  RefreshCw,
  Zap,
  ChevronRight,
  ShieldCheck,
  Lock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import { api, checkoutApi } from "@/lib/api";
import toast from "react-hot-toast";

const isMongoObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value);

const narrativeStatus = {
  pending: {
    label: "Order placed",
    description: "The order has been placed and payment is being held securely.",
    icon: Lock,
    color: "emerald",
  },
  confirmed: {
    label: "Order confirmed",
    description: "You have confirmed the order and are getting it ready.",
    icon: Store,
    color: "blue",
  },
  processing: {
    label: "Packing order",
    description: "The order is being packed and prepared for shipping.",
    icon: Package,
    color: "purple",
  },
  shipped: {
    label: "In Transit",
    description: "Package is moving through the logistics network.",
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
    description: "Transaction cancelled. Funds returned to buyer.",
    icon: XCircle,
    color: "red",
  },
};

const SELLER_STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  pending: [{ next: "confirmed", label: "Confirm Order", color: "bg-blue-500 hover:bg-blue-600" }],
  confirmed: [{ next: "processing", label: "Mark Processing", color: "bg-amber-500 hover:bg-amber-600" }],
  processing: [{ next: "shipped", label: "Mark as Shipped", color: "bg-purple-500 hover:bg-purple-600" }],
  shipped: [],
  delivered: [],
  cancelled: [],
};

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      const id = String(params.id);
      if (!isMongoObjectId(id)) {
        toast.error("This order link is invalid. Please open the order from your list.");
        router.push("/seller/orders");
        return;
      }
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
        router.push("/seller/orders");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast.error(error.message || "Failed to load order");
      router.push("/seller/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(newStatus);
    try {
      const res = await api(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res?.success) {
        toast.success(`Order marked as ${newStatus}`);
        await fetchOrder();
      } else {
        toast.error(res?.message || "Failed to update order status");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-10 w-10 animate-spin text-taja-primary mb-4" />
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!order) return null;

  const currentNarrative = narrativeStatus[order.status as keyof typeof narrativeStatus] || narrativeStatus.pending;
  const nextActions = SELLER_STATUS_FLOW[order.status] || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10 relative">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/seller/orders">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white shadow-sm border border-gray-100 h-14 w-14">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <Link href="/seller" className="hover:text-taja-primary">Merchant Hub</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/seller/orders" className="hover:text-taja-primary">Orders</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-taja-secondary">Management</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-black text-taja-secondary tracking-tighter uppercase italic">
                Order <span className="text-taja-primary">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-14 rounded-2xl glass-card border-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm px-8"
              onClick={fetchOrder}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Sync data
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-2xl glass-card border-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm px-8 hidden md:flex"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Delivery list
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-taja-secondary via-taja-secondary to-black shadow-premium"
            >
              <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.9rem] p-10 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Money on hold • Taja Escrow Protection</span>
                    </div>

                    <div>
                      <h2 className="text-5xl font-black text-white tracking-tighter mb-3 uppercase italic">
                        {currentNarrative.label}
                      </h2>
                      <p className="text-gray-400 font-medium max-w-sm text-sm">
                        {currentNarrative.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 pt-4">
                      {nextActions.map((action) => (
                        <Button
                          key={action.next}
                          onClick={() => handleUpdateStatus(action.next)}
                          disabled={updatingStatus !== null}
                          className={cn(
                            "h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                            action.color
                          )}
                        >
                          {updatingStatus === action.next ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 px-10 py-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payout Value</p>
                    <p className="text-5xl font-black text-white tracking-tighter">
                      {formatCurrency(order.totals.total)}
                    </p>
                    <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-taja-primary/10 rounded-full border border-taja-primary/20">
                      <Zap className="w-3.5 h-3.5 text-taja-primary fill-taja-primary" />
                      <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Merchant Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <Card className="rounded-[3rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-10 pt-10">
                <CardTitle className="text-xl font-black text-taja-secondary tracking-tight uppercase italic">Order items</CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-12">
                <div className="space-y-6">
                  {order.items.map((item: any) => (
                    <div key={item._id} className="group relative flex items-center gap-8 p-6 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-premium transition-all duration-500">
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-500 bg-gray-50">
                        <Image
                          src={item.image || "/placeholder-product.jpg"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <h4 className="text-xl font-black text-taja-secondary tracking-tight mb-2 group-hover:text-taja-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              SKU: {item.product?._id.slice(-10).toUpperCase()}
                            </p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                              {item.quantity} Units × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-taja-secondary tracking-tighter">
                              {formatCurrency(item.subtotal || item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order History */}
            <Card className="rounded-[3rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-10 pt-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black text-taja-secondary tracking-tight uppercase italic">Order history</CardTitle>
                  <Badge variant="outline" className="rounded-full border-gray-100 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 text-gray-400">
                    <RefreshCw className="w-3 h-3 mr-2 text-taja-primary" />
                    Updating...
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-10 pb-12">
                <div className="relative mt-10 ml-4">
                  <div className="absolute left-[-2px] top-2 bottom-2 w-1 bg-gradient-to-b from-taja-primary/40 via-gray-100 to-gray-50" />

                  <div className="space-y-12">
                    {[...(order.timeline || [])].reverse().map((event, index) => {
                      const config = narrativeStatus[event.status as keyof typeof narrativeStatus] || narrativeStatus.pending;
                      const isFirst = index === 0;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex gap-10"
                        >
                          <div className={cn(
                            "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
                            isFirst ? "bg-taja-secondary text-white scale-110 shadow-taja-primary/20 ring-4 ring-taja-primary/10" : "bg-white text-gray-400 border border-gray-100"
                          )}>
                            <config.icon className={cn("w-6 h-6", isFirst && "text-taja-primary")} />
                          </div>

                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={cn(
                                "text-base font-black tracking-tight uppercase italic",
                                isFirst ? "text-taja-secondary" : "text-gray-400"
                              )}>
                                {config.label}
                              </h4>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {new Date(event.timestamp).toLocaleString()}
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Customer Details */}
            <Card className="rounded-[2.5rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight uppercase italic flex items-center gap-3">
                    <User className="w-5 h-5 text-taja-primary" />
                    Customer details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="flex items-center gap-6 mb-8 p-4 rounded-3xl bg-gray-50/50 border border-gray-100">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner border border-white">
                    <Image
                      src={order.buyer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.buyer?.fullName || "Buyer")}&background=EBE9F5&color=111827`}
                      alt={order.buyer?.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-taja-secondary tracking-tight">{order.buyer?.fullName}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Confirmed Identity</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/chat?buyer=${order.buyer?._id}&order=${order._id}`} className="block">
                    <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-sm bg-taja-secondary hover:bg-black transition-all">
                      <MessageSquare className="w-4 h-4 mr-3" />
                      Secure Channel
                    </Button>
                  </Link>
                  {order.buyer?.phone && (
                   <div className="grid grid-cols-2 gap-3">
                      <a href={`tel:${order.buyer.phone}`} className="block">
                        <Button variant="outline" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-gray-100 hover:bg-gray-50">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${order.buyer.phone.replace(/[\s\+\-]/g, "")}`} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                          WhatsApp
                        </Button>
                      </a>
                   </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card className="rounded-[2.5rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight uppercase italic flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-taja-primary" />
                    Delivery details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Courier Endpoint</p>
                    <div className="space-y-1 text-sm text-taja-secondary font-medium">
                      <p className="font-black text-base">{order.shippingAddress.fullName || order.buyer?.fullName}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                      <p>{order.shippingAddress.country} {order.shippingAddress.postalCode}</p>
                    </div>
                  </div>

                  {order.shippingAddress.phone && (
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact for Delivery</p>
                        <p className="text-sm font-black text-taja-secondary">{order.shippingAddress.phone}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-6 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4 leading-relaxed">
                        Tracking information can be updated in the delivery details.
                    </p>
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-taja-primary hover:bg-taja-primary/5 rounded-xl">
                        View delivery details
                    </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="rounded-[2.5rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight uppercase italic flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-taja-primary" />
                    Payment summary
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Subtotal</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Logistics Fee</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.shipping || order.totals.shippingCost || 0)}</span>
                  </div>
                  {order.deliveryQuoteSnapshot && (
                    <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100/80 px-4 py-3 text-[11px] text-slate-600 leading-relaxed">
                      <p className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-1">
                        Buyer delivery zone (checkout)
                      </p>
                      <p className="font-bold text-slate-700">{order.deliveryQuoteSnapshot.zoneLabel}</p>
                      {order.deliveryQuoteSnapshot.matchedAlias && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Matched: <span className="font-mono">{order.deliveryQuoteSnapshot.matchedAlias}</span>
                        </p>
                      )}
                      {order.deliveryQuoteSnapshot.isEstimate && (
                        <p className="text-[10px] text-amber-800 font-semibold mt-1">Flagged as estimate at checkout.</p>
                      )}
                      {order.deliveryQuoteSnapshot.version && (
                        <p className="text-[9px] text-slate-400 mt-2 font-mono">{order.deliveryQuoteSnapshot.version}</p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Tax</span>
                    <span className="text-taja-secondary font-black">{formatCurrency(order.totals.tax)}</span>
                  </div>
                  <div className="h-px bg-gray-100 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-taja-secondary tracking-tight">Net Payout</span>
                    <span className="text-3xl font-black text-taja-primary tracking-tighter">{formatCurrency(order.totals.total)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-taja-primary" />
                        <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">Paystack Settlement</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black tracking-widest">SECURED</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <div className="flex flex-col gap-3 px-6 pb-6">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center leading-relaxed">
                    Merchant support and help with orders are available 24/7.
                </p>
                <Link href={`/seller/support?order=${params.id}`} className="text-center">
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors h-14 rounded-2xl w-full border border-transparent hover:border-red-100">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Get help with this order
                    </Button>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
