"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkoutApi, trackingApi, api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  Package,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Shield,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SellerLogisticsMap = dynamic(
  () => import("@/components/seller/SellerLogisticsMap").then((m) => m.SellerLogisticsMap),
  { ssr: false }
);

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "flutterwave" | "paystack" | "bank_transfer" | "cod" | "crypto";
  totals: {
    total: number;
  };
  shippingAddress?: {
    city?: string;
    state?: string;
    addressLine1?: string;
  };
  createdAt: string;
}

interface TrackingEvent {
  status: string;
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  isCashOnDelivery: boolean;
  shippingAddress?: Order["shippingAddress"];
  history: TrackingEvent[];
}

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const statusDisplay: Record<OrderStatus, { class: string; icon: any }> = {
  pending: { class: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: Clock },
  confirmed: { class: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Shield },
  processing: { class: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Zap },
  shipped: { class: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Truck },
  delivered: { class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { class: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
  refunded: { class: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: CreditCard },
};

const paymentLabel: Record<Order["paymentMethod"], string> = {
  flutterwave: "Flutterwave",
  paystack: "Paystack",
  bank_transfer: "Bank Transfer",
  cod: "COD Protocol",
  crypto: "Neural Crypto",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerLogisticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [shop, setShop] = useState<{
    _id: string;
    settings?: {
      defaultDeliveryFee?: number;
      pickupPoints?: Array<{ name: string; address: string; city: string; state: string; phone?: string }>;
      globalDeliveryEnabled?: boolean;
      globalMinOrderAmount?: number;
      deliveryFeeTiers?: Array<{ minWeightKg: number; maxWeightKg: number; priceNaira: number }>;
      deliverySlots?: Array<{
        id: string;
        date: Date;
        startTime: string;
        endTime?: string;
        maxOrders: number;
        notes?: string;
        active?: boolean;
      }>;
    };
  } | null>(null);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pickupPoints, setPickupPoints] = useState<Array<{ name: string; address: string; city: string; state: string; phone?: string }>>([]);
  const [globalDeliveryEnabled, setGlobalDeliveryEnabled] = useState(true);
  const [globalMinOrderAmount, setGlobalMinOrderAmount] = useState(0);
  const [deliveryFeeTiers, setDeliveryFeeTiers] = useState<Array<{ minWeightKg: number; maxWeightKg: number; priceNaira: number }>>([]);
  const [deliverySlots, setDeliverySlots] = useState<
    Array<{ id: string; date: string; startTime: string; endTime: string; maxOrders: number; notes?: string; active: boolean }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/api/shops/my") as { success?: boolean; data?: { _id: string; settings?: any } };
        if (res?.success && res?.data) {
          setShop(res.data);
          setDeliveryFee(res.data.settings?.defaultDeliveryFee ?? 0);
          setPickupPoints(res.data.settings?.pickupPoints?.length ? [...res.data.settings.pickupPoints] : []);
          setGlobalDeliveryEnabled(
            typeof res.data.settings?.globalDeliveryEnabled === "boolean" ? res.data.settings.globalDeliveryEnabled : true
          );
          setGlobalMinOrderAmount(res.data.settings?.globalMinOrderAmount ?? 0);
          setDeliveryFeeTiers(
            Array.isArray(res.data.settings?.deliveryFeeTiers) ? [...res.data.settings.deliveryFeeTiers] : []
          );
          setDeliverySlots(
            Array.isArray(res.data.settings?.deliverySlots)
              ? res.data.settings.deliverySlots.map((slot: any) => ({
                  id: slot.id,
                  date: slot.date ? new Date(slot.date).toISOString().slice(0, 10) : "",
                  startTime: slot.startTime || "",
                  endTime: slot.endTime || "",
                  maxOrders: slot.maxOrders ?? 0,
                  notes: slot.notes || "",
                  active: slot.active !== false,
                }))
              : []
          );
        }
      } catch {
        // no shop
      }
    })();
  }, []);

  const saveDeliverySettings = async () => {
    if (!shop?._id) return;
    setDeliverySaving(true);
    try {
      await api(`/api/shops/${shop._id}`, {
        method: "PUT",
        body: JSON.stringify({
          settings: {
            ...shop.settings,
            defaultDeliveryFee: deliveryFee,
            pickupPoints: pickupPoints.filter((p) => p.name.trim() || p.address.trim()),
            globalDeliveryEnabled,
            globalMinOrderAmount,
            deliveryFeeTiers: deliveryFeeTiers.filter(
              (t) => t.maxWeightKg > 0 && t.priceNaira >= 0
            ),
            deliverySlots: deliverySlots
              .filter((s) => s.date && s.startTime && s.maxOrders > 0)
              .map((s) => ({
                id: s.id,
                date: new Date(s.date),
                startTime: s.startTime,
                endTime: s.endTime || undefined,
                maxOrders: s.maxOrders,
                notes: s.notes || undefined,
                active: s.active,
              })),
          },
        }),
      });
      setShop((s) =>
        s
          ? {
              ...s,
              settings: {
                ...s.settings,
                defaultDeliveryFee: deliveryFee,
                pickupPoints,
                globalDeliveryEnabled,
                globalMinOrderAmount,
                deliveryFeeTiers,
                deliverySlots: deliverySlots.map((slot) => ({
                  id: slot.id,
                  date: new Date(slot.date),
                  startTime: slot.startTime,
                  endTime: slot.endTime || undefined,
                  maxOrders: slot.maxOrders,
                  notes: slot.notes || undefined,
                  active: slot.active,
                })),
              },
            }
          : null
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setDeliverySaving(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await checkoutApi.getOrders({
          page: 1,
          limit: 20,
          role: "seller",
        });
        const list = response?.data?.orders || response?.data || [];
        setOrders(list);
        if (list.length > 0) {
          handleSelectOrder(list[0]);
        }
      } catch (error) {
        console.error("Failed to load seller logistics orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    try {
      setTrackingLoading(true);
      const response = await trackingApi.getTrackingHistory(order._id);
      if (response?.success && response?.data) {
        setTracking(response.data as TrackingInfo);
      } else {
        setTracking(null);
      }
    } catch (error) {
      console.error("Failed to load tracking info:", error);
      setTracking(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (loading && orders.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-taja-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-taja-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">Initializing Global Tracking...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-10 py-10"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic">
              Logistics <span className="text-taja-primary">Hub</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Monitoring <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">{orders.length} Active Shipments</span> • Tactical Surveillance
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-6 py-3 glass-card border-white/60">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">In Transit</span>
              <span className="text-sm font-black text-taja-secondary leading-none">
                {orders.filter((o) => ["processing", "shipped"].includes(o.status)).length} Units
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl h-12 border-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-taja-secondary"
            onClick={() => window.location.reload()}
          >
            <Clock className="mr-2 h-4 w-4" />
            Refresh Uplink
          </Button>
        </div>
      </motion.div>

      {/* Delivery & fees (manage delivery fee, pickup points, tiers & slots) */}
      {shop && (
        <motion.div variants={item} className="glass-panel rounded-2xl border border-white/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-taja-secondary flex items-center gap-2">
            <MapPin className="h-4 w-4 text-taja-primary" />
            Delivery & capacity configuration
          </h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGlobalDeliveryEnabled((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all ${
                  globalDeliveryEnabled ? "bg-emerald-500 border-emerald-500" : "bg-gray-200 border-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    globalDeliveryEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Global Delivery {globalDeliveryEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-[11px] text-gray-500">
                  Controls whether this shop offers delivery (vs pickup-only).
                </p>
              </div>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Minimum order amount (₦)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={globalMinOrderAmount}
                onChange={(e) => setGlobalMinOrderAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={!globalDeliveryEnabled}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-taja-secondary disabled:bg-gray-100 disabled:text-gray-400"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Orders below this amount cannot use delivery for this shop.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Default delivery fee (₦)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-taja-secondary"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={saveDeliverySettings}
                disabled={deliverySaving}
                className="rounded-xl"
              >
                {deliverySaving ? "Saving…" : "Save delivery settings"}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Pickup / drop-off points</label>
            {pickupPoints.map((point, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-lg bg-white/50">
                <input
                  type="text"
                  value={point.name}
                  onChange={(e) => {
                    const next = [...pickupPoints];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setPickupPoints(next);
                  }}
                  placeholder="Name"
                  className="w-28 h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={point.address}
                  onChange={(e) => {
                    const next = [...pickupPoints];
                    next[idx] = { ...next[idx], address: e.target.value };
                    setPickupPoints(next);
                  }}
                  placeholder="Address"
                  className="flex-1 min-w-[120px] h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={point.city}
                  onChange={(e) => {
                    const next = [...pickupPoints];
                    next[idx] = { ...next[idx], city: e.target.value };
                    setPickupPoints(next);
                  }}
                  placeholder="City"
                  className="w-24 h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={point.state}
                  onChange={(e) => {
                    const next = [...pickupPoints];
                    next[idx] = { ...next[idx], state: e.target.value };
                    setPickupPoints(next);
                  }}
                  placeholder="State"
                  className="w-20 h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <button type="button" onClick={() => setPickupPoints((p) => p.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPickupPoints((p) => [...p, { name: "", address: "", city: "", state: "" }])}
              className="text-sm text-taja-primary font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add pickup point
            </button>
          </div>
          <div className="pt-4 border-t border-white/40 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Delivery fee tiers (by total order weight)</p>
            </div>
            {deliveryFeeTiers.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-2">
                <div className="col-span-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Min weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.minWeightKg}
                    onChange={(e) => {
                      const next = [...deliveryFeeTiers];
                      next[idx] = { ...next[idx], minWeightKg: parseFloat(e.target.value) || 0 };
                      setDeliveryFeeTiers(next);
                    }}
                    className="w-full h-9 px-3 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Max weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.maxWeightKg}
                    onChange={(e) => {
                      const next = [...deliveryFeeTiers];
                      next[idx] = { ...next[idx], maxWeightKg: parseFloat(e.target.value) || 0 };
                      setDeliveryFeeTiers(next);
                    }}
                    className="w-full h-9 px-3 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Fee (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={tier.priceNaira}
                    onChange={(e) => {
                      const next = [...deliveryFeeTiers];
                      next[idx] = { ...next[idx], priceNaira: Math.max(0, parseInt(e.target.value, 10) || 0) };
                      setDeliveryFeeTiers(next);
                    }}
                    className="w-full h-9 px-3 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeliveryFeeTiers((tiers) => tiers.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setDeliveryFeeTiers((tiers) => [...tiers, { minWeightKg: 0, maxWeightKg: 0, priceNaira: 0 }])
              }
              className="text-sm text-taja-primary font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add weight tier
            </button>
            <p className="text-[10px] text-gray-400">
              These tiers are applied using the total order weight when products don&apos;t specify their own shipping cost.
            </p>
          </div>
          <div className="pt-4 border-t border-white/40 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Delivery slots (daily capacity)</p>
            </div>
            {deliverySlots.map((slot, idx) => (
              <div key={slot.id} className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-lg bg-white/60">
                <input
                  type="date"
                  value={slot.date}
                  onChange={(e) => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], date: e.target.value };
                    setDeliverySlots(next);
                  }}
                  className="h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], startTime: e.target.value };
                    setDeliverySlots(next);
                  }}
                  className="h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], endTime: e.target.value };
                    setDeliverySlots(next);
                  }}
                  className="h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={slot.maxOrders}
                  onChange={(e) => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], maxOrders: Math.max(1, parseInt(e.target.value, 10) || 1) };
                    setDeliverySlots(next);
                  }}
                  placeholder="Max orders"
                  className="w-24 h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={slot.notes || ""}
                  onChange={(e) => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], notes: e.target.value };
                    setDeliverySlots(next);
                  }}
                  placeholder="Notes (optional)"
                  className="flex-1 min-w-[120px] h-9 px-2 rounded border border-gray-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...deliverySlots];
                    next[idx] = { ...next[idx], active: !slot.active };
                    setDeliverySlots(next);
                  }}
                  className={`px-3 h-9 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    slot.active
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {slot.active ? "Active" : "Paused"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverySlots((slots) => slots.filter((s) => s.id !== slot.id))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setDeliverySlots((slots) => [
                  ...slots,
                  {
                    id: Math.random().toString(36).slice(2, 10),
                    date: "",
                    startTime: "",
                    endTime: "",
                    maxOrders: 1,
                    notes: "",
                    active: true,
                  },
                ])
              }
              className="text-sm text-taja-primary font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add delivery slot
            </button>
            <p className="text-[10px] text-gray-400">
              Slots are used to plan how many orders you can comfortably handle per day and time window.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar: Order List */}
        <motion.div variants={item} className="lg:col-span-4 space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "pending", "processing", "shipped", "delivered"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all duration-300 ${statusFilter === s
                  ? "bg-taja-primary text-white border-taja-primary shadow-emerald"
                  : "glass-card border-white/60 text-gray-500 hover:text-taja-secondary"
                  }`}
              >
                {s === "all" ? "All" : statusLabel[s]}
              </button>
            ))}
          </div>

          <div className="glass-panel overflow-hidden border-white/60 rounded-[32px] flex flex-col max-h-[700px]">
            <div className="p-6 border-b border-white/40 flex items-center justify-between">
              <h2 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Surveillance Targets</h2>
              <Badge variant="secondary" className="text-[9px] border border-white/60 uppercase bg-white/60">
                {filteredOrders.length}
              </Badge>
            </div>

            <div className="overflow-y-auto scrollbar-hide flex-1 divide-y divide-white/20">
              {filteredOrders.length === 0 ? (
                <div className="p-20 text-center opacity-40">
                  <Package className="h-12 w-12 mx-auto mb-4 text-taja-light" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Signals</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?._id === order._id;
                  const display = statusDisplay[order.status];
                  return (
                    <button
                      key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className={`w-full text-left p-6 flex flex-col gap-4 transition-all relative group ${isSelected ? "bg-white/40 scale-[0.98] z-10" : "hover:bg-white/20"}`}
                    >
                      {isSelected && <motion.div layoutId="trackActive" className="absolute left-0 top-0 bottom-0 w-1 bg-taja-primary" />}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-taja-primary text-white shadow-emerald' : 'bg-white shadow-sm border border-white/60 text-taja-primary'}`}>
                            <display.icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-taja-secondary tracking-tight">#{order.orderNumber?.slice(-6) || order._id.slice(-6).toUpperCase()}</span>
                            <span className="text-[9px] font-bold text-gray-400 font-mono italic">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-taja-secondary">₦{order.totals.total.toLocaleString()}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocol Paid</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${display.class}`}>
                          {statusLabel[order.status]}
                        </span>
                        {order.paymentMethod === 'cod' && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-amber-500/20 text-amber-500 bg-amber-500/5 anim-pulse">
                            COD Active
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 text-gray-300 group-hover:text-taja-primary transition-all ${isSelected ? 'translate-x-1 text-taja-primary' : ''}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content: Map & History */}
        <motion.div variants={item} className="lg:col-span-8 space-y-10">
          {!selectedOrder ? (
            <div className="glass-panel h-full min-h-[500px] flex flex-col items-center justify-center border-white/60 rounded-[40px] border-dashed">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-taja-primary/20 blur-2xl rounded-full" />
                <Truck className="h-16 w-16 text-taja-primary relative animate-bounce" />
              </div>
              <h3 className="text-3xl font-black text-taja-secondary tracking-tight mb-3">Satellite Offline</h3>
              <p className="text-gray-500 max-w-sm text-center font-medium">Select a tactical objective from the operational logs to initialize real-time visual surveillance.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Order Quick Info Card */}
              <div className="glass-panel p-8 border-white/60 rounded-[40px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-[80px] rounded-full -z-10" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-gradient-taja p-1 flex items-center justify-center shadow-lg">
                      <div className="w-full h-full rounded-[20px] bg-taja-secondary/40 backdrop-blur-sm flex items-center justify-center text-white">
                        <Target className="h-8 w-8" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em] mb-1">Target Identity</p>
                      <h2 className="text-2xl font-black text-taja-secondary tracking-tighter">ORD-{selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={`px-6 py-2 h-auto text-[10px] font-black uppercase tracking-[0.2em] rounded-full border shadow-sm ${statusDisplay[selectedOrder.status].class}`}>
                      {statusLabel[selectedOrder.status]}
                    </Badge>
                    {selectedOrder.paymentMethod === "cod" && (
                      <Badge className="px-6 py-2 h-auto text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-500/20 text-amber-600 bg-amber-500/10 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Collect At Base
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <MapPin className="h-4 w-4" /> Destination
                    </div>
                    <div>
                      <p className="text-sm font-black text-taja-secondary mb-1">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                      </p>
                      <p className="text-[11px] font-medium text-gray-500 leading-relaxed italic">
                        {selectedOrder.shippingAddress?.addressLine1}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <Clock className="h-4 w-4" /> Operational History
                    </div>
                    <div>
                      <p className="text-sm font-black text-taja-secondary mb-1">
                        {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400 font-mono">
                        Initialized: {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <CreditCard className="h-4 w-4" /> Asset Valuation
                    </div>
                    <div>
                      <p className="text-xl font-black text-taja-primary tracking-tighter mb-1">
                        ₦{selectedOrder.totals.total.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {paymentLabel[selectedOrder.paymentMethod]} Net
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Timeline Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                <div className="xl:col-span-3 space-y-4">
                  <div className="glass-panel overflow-hidden border-white/60 rounded-[40px] h-[400px] group">
                    <SellerLogisticsMap
                      orderNumber={selectedOrder.orderNumber || `ORD-${selectedOrder._id.slice(-6).toUpperCase()}`}
                      status={selectedOrder.status}
                      city={selectedOrder.shippingAddress?.city}
                      state={selectedOrder.shippingAddress?.state}
                    />
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 glass-card border-white/40 italic">
                    <Sparkles className="h-4 w-4 text-taja-primary" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                      Dynamic Simulation Uplink • Neural Geo-Spatial Intelligence
                    </p>
                  </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/20" />
                    <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Operational Timeline</h3>
                    <div className="h-px w-10 bg-white/20" />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-taja-primary/40 to-white/10" />
                    <div className="space-y-8 pl-12">
                      {trackingLoading ? (
                        <div className="flex items-center gap-4 py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-taja-primary border-t-transparent" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Decoding Timeline...</span>
                        </div>
                      ) : tracking?.history?.length ? (
                        tracking.history.map((event, idx) => (
                          <div key={idx} className="relative group">
                            <div className={`absolute -left-[45px] top-1.5 h-6 w-6 rounded-full border-4 flex items-center justify-center transition-all ${event.completed ? 'bg-taja-primary border-white/50 shadow-emerald scale-110' : 'bg-white border-white/20'}`}>
                              {event.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <div className={`p-5 rounded-[24px] border transition-all duration-300 ${event.completed ? 'glass-card border-white/60 bg-white shadow-premium' : 'opacity-40 border-transparent bg-transparent'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <p className={`text-[11px] font-black uppercase tracking-widest ${event.completed ? 'text-taja-secondary' : 'text-gray-400'}`}>
                                  {event.label}
                                </p>
                                <span className="text-[9px] font-bold text-taja-primary font-mono italic">
                                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className={`text-xs leading-relaxed ${event.completed ? 'text-gray-500 font-medium' : 'text-gray-400'}`}>
                                {event.description}
                              </p>
                              <div className="mt-3 flex justify-end">
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                                  {new Date(event.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 glass-card border-white/60 text-center rounded-[32px] opacity-60">
                          <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Timeline Incomplete</p>
                          <p className="text-[10px] font-medium text-gray-400 mt-2">Telemetry will populate as logistics protocols execute.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}








