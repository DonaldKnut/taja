"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, MapPin, CreditCard, ArrowLeft, CheckCircle, Package,
  Truck, Lock, ShieldCheck, ChevronRight, Zap, Tag, AlertCircle,
  Clock, Wallet, Plus, Trash2, X, Home, Phone, User as UserIcon, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { checkoutApi, usersApi, cartApi, api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";
import { Container } from "@/components/layout";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

const NIGERIAN_STATES = ["Lagos"];

// ─── AddressModal ─────────────────────────────────────────────────────────────
// ─── AddressModal ─────────────────────────────────────────────────────────────
interface AddressModalProps {
  onClose: () => void;
  onSaved: (addr: Address) => void;
  editAddress?: Address | null;
}

function AddressModal({ onClose, onSaved, editAddress }: AddressModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: editAddress?.fullName || "",
    phone: editAddress?.phone || "",
    addressLine1: editAddress?.addressLine1 || "",
    addressLine2: editAddress?.addressLine2 || "",
    city: editAddress?.city || "",
    state: editAddress?.state || "Lagos",
    postalCode: editAddress?.postalCode || "",
    country: editAddress?.country || "Nigeria",
    isDefault: editAddress?.isDefault || false,
  });

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.state) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!editAddress;
      const url = "/api/users/addresses";
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing ? { ...form, addressId: editAddress._id } : form;

      const res = await api(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        toast.success(isEditing ? "Address updated!" : "Address saved!");
        onSaved(res.data);
        onClose();
      } else {
        toast.error(res?.message || `Failed to ${isEditing ? 'update' : 'save'} address`);
      }
    } catch {
      toast.error(`Failed to ${editAddress ? 'update' : 'save'} address`);
    } finally {
      setSaving(false);
    }
  };

  const F = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">{editAddress ? "Update Address" : "New Shipping Address"}</p>
            <h3 className="text-2xl font-black text-taja-secondary tracking-tighter">{editAddress ? "Edit Address" : "Add Address"}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
              <input value={form.fullName} onChange={F("fullName")} placeholder="John Doe"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone *</label>
              <input value={form.phone} onChange={F("phone")} placeholder="080XXXXXXXX" type="tel"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address Line 1 *</label>
            <input value={form.addressLine1} onChange={F("addressLine1")} placeholder="House No, Street Name"
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address Line 2</label>
            <input value={form.addressLine2} onChange={F("addressLine2")} placeholder="Landmark, estate, etc."
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City *</label>
              <input value={form.city} onChange={F("city")} placeholder="Lagos Island"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
            </div>
            <div className="group space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State *</label>
              <div className="w-full h-12 px-4 rounded-2xl bg-slate-100 flex items-center text-sm font-bold text-taja-secondary opacity-70">
                Lagos
              </div>
              <p className="text-[9px] text-gray-400 mt-1 ml-1 font-bold uppercase tracking-widest italic">Lagos only shipping</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Postal Code</label>
            <input value={form.postalCode} onChange={F("postalCode")} placeholder="100001"
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary text-sm font-bold text-taja-secondary outline-none transition-all" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={cn(
              "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
              form.isDefault ? "bg-taja-primary" : "bg-slate-100 ring-1 ring-slate-300"
            )} onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}>
              {form.isDefault && <CheckCircle className="h-3 w-3 text-white" />}
            </div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Set as default address</span>
          </label>
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest bg-taja-secondary hover:bg-taja-primary text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editAddress ? "Update Address" : "Save Address")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main CheckoutPage ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedPaymentMethod] = useState<string>("paystack");
  const [couponCode, setCouponCode] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [deliverySlots, setDeliverySlots] = useState<Array<any>>([]);
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState<string>("");
  const [shippingCost, setShippingCost] = useState(4000);
  const [shippingQuoteMeta, setShippingQuoteMeta] = useState<{
    zone?: string;
    note?: string;
    estimate?: boolean;
  } | null>(null);

  // ── Load addresses on mount ──────────────────────────────────────────────
  const loadAddresses = async () => {
    try {
      const res = await api("/api/users/addresses");
      const data: Address[] = Array.isArray(res?.data) ? res.data : [];
      setAddresses(data);
      const def = data.find(a => a.isDefault) || data[0];
      if (def && !selectedAddress) setSelectedAddress(def._id);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  useEffect(() => {
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(cartTotal);
  }, [cartItems]);

  // Lagos zone quote (matches server order totals)
  useEffect(() => {
    const addr = addresses.find((a) => a._id === selectedAddress);
    if (!addr) {
      setShippingCost(4000);
      setShippingQuoteMeta(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/delivery/lagos-quote", {
          method: "POST",
          body: JSON.stringify({
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || "",
            city: addr.city,
            state: addr.state,
          }),
        });
        if (cancelled) return;
        if (res?.success && res.data && typeof res.data.priceNgn === "number") {
          setShippingCost(res.data.priceNgn);
          setShippingQuoteMeta({
            zone: res.data.zoneLabel,
            note: res.data.buyerNote,
            estimate: !!res.data.isEstimate,
          });
        }
      } catch {
        if (!cancelled) {
          setShippingCost(4000);
          setShippingQuoteMeta(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAddress, addresses]);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        if (!cartItems.length) return;
        const productRes: any = await fetch(`/api/products/${encodeURIComponent(cartItems[0]._id)}`).then(r => r.json());
        const sid = productRes?.data?.shop?._id || null;
        if (!sid) return;
        const slotsRes: any = await fetch(`/api/shops/${encodeURIComponent(sid)}/delivery-slots`).then(r => r.json());
        if (slotsRes?.success && Array.isArray(slotsRes?.data)) setDeliverySlots(slotsRes.data);
      } catch { /* silent */ }
    };
    loadSlots();
  }, [cartItems.length]);

  // ── Delete address ───────────────────────────────────────────────────────
  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    setDeletingId(addressId);
    try {
      const res = await api(`/api/users/addresses?addressId=${addressId}`, { method: "DELETE" });
      if (res?.success) {
        const updated = addresses.filter(a => a._id !== addressId);
        setAddresses(updated);
        if (selectedAddress === addressId) setSelectedAddress(updated[0]?._id || "");
        toast.success("Address removed");
      } else {
        toast.error(res?.message || "Failed to remove address");
      }
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setDeletingId(null);
    }
  };

  const tax = Math.round(subtotal * 0.075); // 7.5% VAT to match backend
  const orderTotal = subtotal + shippingCost + tax;

  // ── Place order → Paystack ───────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or add a delivery address");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          variantId: item.variantId
        })),
        shippingAddress: selectedAddress,
        paymentMethod: "paystack",
        couponCode: couponCode || undefined,
        deliverySlotId: selectedDeliverySlotId || undefined,
        fromCart: true,
      };

      // Cash on Delivery is no longer supported per user request

      // Flow 2: Paystack (Payment FIRST)
      // 1. Load Paystack Script
      const loadPaystack = () => new Promise((resolve) => {
        if ((window as any).PaystackPop) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.onload = () => resolve(true);
        document.body.appendChild(script);
      });
      await loadPaystack();

      // 2. Get Public Key
      const configRes = await fetch("/api/payments/config").then(r => r.json());
      if (!configRes.success) throw new Error("Payment system configuration failed");

      // 3. Open Modal
      const handler = (window as any).PaystackPop.setup({
        key: configRes.publicKey,
        email: user?.email || "customer@taja.shop",
        amount: Math.round(orderTotal * 100), // Kobo - ensure integer
        currency: "NGN",
        onClose: () => {
          setLoading(false);
          toast("Payment cancelled", { icon: "ℹ️" });
        },
        callback: (response: any) => {
          // Success! Now create order with reference
          setLoading(true);
          (async () => {
            try {
              const finalOrderResponse = await checkoutApi.createOrder({
                ...orderPayload,
                paymentReference: response.reference
              });

              if (finalOrderResponse?.success !== false) {
                const orderId = finalOrderResponse?.data?._id || finalOrderResponse?._id;
                clearCart();
                await cartApi.clearCart().catch(() => { });
                toast.success("Payment successful! Order placed.");
                router.push(`/dashboard/orders/${orderId}`);
              } else {
                toast.error(finalOrderResponse?.message || "Payment verified but order creation failed. Please contact support.");
              }
            } catch (err: any) {
              toast.error(err.message || "Finalizing order failed. Please contact support.");
            } finally {
              setLoading(false);
            }
          })();
        }
      });

      handler.openIframe();

    } catch (error: any) {
      toast.error(error?.message || "Failed to initiate checkout. Please try again.");
      setLoading(false);
    }
  };



  // ── Empty cart ───────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white">
          <AppHeader />
          <Container size="sm" className="pt-20 text-center space-y-8">
            <div className="mx-auto w-24 h-24 rounded-full bg-taja-light flex items-center justify-center animate-bounce">
              <ShoppingCart className="h-10 w-10 text-taja-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">Your Cart is Empty.</h2>
              <p className="text-gray-400 font-medium max-w-xs mx-auto">It looks like you haven&apos;t added anything to your cart yet. Explore our marketplace to find something you love.</p>
            </div>
            <Link href="/marketplace">
              <Button size="lg" className="rounded-full px-12 h-16 shadow-premium group">
                <span className="font-black uppercase tracking-widest text-xs">Explore Marketplace</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AnimatePresence>
        {showAddressModal && (
          <AddressModal
            onClose={() => {
              setShowAddressModal(false);
              setEditingAddress(null);
            }}
            editAddress={editingAddress}
            onSaved={(addr) => {
              if (editingAddress) {
                setAddresses(prev => prev.map(a => a._id === addr._id ? addr : a));
              } else {
                setAddresses(prev => [...prev, addr]);
                setSelectedAddress(addr._id);
              }
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#FDFDFD]">
        <AppHeader />

        <main className="relative z-10 pt-8 pb-32">
          <Container size="lg">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-taja-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Secure Checkout</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-none">
                  Complete Your Purchase
                </h1>
                <p className="text-gray-400 font-medium text-sm">Review your items and complete your secure payment.</p>
              </div>
              <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-[2rem] border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-taja-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Secure Payment</p>
                  <p className="text-[9px] font-bold text-emerald-800/60 uppercase">Protected by Escrow</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-8">

                {/* ── 1. DELIVERY HUB ─────────────────────────────────── */}
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-taja-primary/10 rounded-2xl">
                        <MapPin className="w-5 h-5 text-taja-primary" />
                      </div>
                      <h2 className="text-xl font-black text-taja-secondary tracking-tight">Shipping Address</h2>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-taja-primary hover:text-taja-secondary transition-colors group"
                    >
                      <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                      Add Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr._id} className="relative group/addr">
                          <button
                            onClick={() => setSelectedAddress(addr._id)}
                            className={cn(
                              "w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 relative",
                              selectedAddress === addr._id
                                ? "border-taja-primary bg-taja-primary/5 ring-4 ring-taja-primary/5"
                                : "border-gray-100 hover:border-gray-200"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                {addr.isDefault ? "Primary" : "Address"}
                              </span>
                              {selectedAddress === addr._id && <CheckCircle className="w-4 h-4 text-taja-primary" />}
                            </div>
                            <p className="font-bold text-taja-secondary text-sm flex items-center gap-1.5">
                              <UserIcon className="h-3 w-3 text-gray-400" /> {addr.fullName}
                            </p>
                            <p className="font-bold text-taja-secondary leading-tight truncate mt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p className="text-xs text-gray-500">{addr.addressLine2}</p>}
                            <p className="text-xs text-gray-400 font-medium mt-1">{addr.city}, {addr.state}</p>
                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" /> {addr.phone}
                            </p>
                          </button>

                          {/* Actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/addr:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setShowAddressModal(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-taja-primary hover:text-white transition-all"
                              title="Edit address"
                            >
                              <div className="h-3.5 w-3.5 flex items-center justify-center">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr._id);
                              }}
                              disabled={deletingId === addr._id}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all"
                              title="Remove address"
                            >
                              {deletingId === addr._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                      <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">No addresses yet</p>
                      <Button size="sm" onClick={() => { setEditingAddress(null); setShowAddressModal(true); }} className="rounded-full gap-2">
                        <Plus className="h-4 w-4" /> Add Your First Address
                      </Button>
                    </div>
                  )}
                </section>

                {/* ── 2. DELIVERY LOGISTICS ────────────────────────────── */}
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-black text-taja-secondary tracking-tight">Delivery Logistics</h2>
                  </div>

                  {deliverySlots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {deliverySlots.map((slot) => (
                        <button
                          key={slot._id}
                          onClick={() => setSelectedDeliverySlotId(slot._id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300",
                            selectedDeliverySlotId === slot._id
                              ? "border-taja-primary bg-taja-primary/5 shadow-lg"
                              : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <Truck className={cn("w-6 h-6 mb-3", selectedDeliverySlotId === slot._id ? "text-taja-primary" : "text-gray-200")} />
                          <span className="text-xs font-black text-taja-secondary uppercase tracking-tight">{slot.day || "Flexible"}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{slot.time || "standard"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-taja-light/30 rounded-3xl border border-taja-primary/5 flex items-center gap-4">
                      <Zap className="w-5 h-5 text-taja-primary" />
                      <p className="text-[10px] font-black uppercase text-taja-secondary tracking-widest">Priority Shipping within 24-48 Hours</p>
                    </div>
                  )}
                </section>

                {/* Secure Payment Info */}
                <div className="p-8 bg-taja-primary/5 rounded-[2.5rem] border border-taja-primary/10 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-taja-primary flex items-center justify-center text-white">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-taja-secondary uppercase tracking-widest text-xs">Secure Card / Bank Payment</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protected by Secure Escrow</p>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Escrow Protection Active</p>
                      <p className="text-xs text-emerald-700/70 font-medium mt-1 leading-relaxed">
                        Your payment is held securely in escrow. Funds are only released to the seller after you confirm delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column — Order Summary */}
              <div className="lg:col-span-4 space-y-8">
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium sticky top-28">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-gray-50 rounded-2xl">
                      <Package className="w-5 h-5 text-taja-secondary" />
                    </div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Order Summary</h2>
                  </div>

                  {/* Items */}
                  <div className="space-y-4 mb-8 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden relative shrink-0 border border-gray-100">
                          <Image src={item.images[0] || "/placeholder.jpg"} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-taja-secondary text-sm truncate">{item.title}</h4>
                          {item.variantName && (
                            <div className="mt-1">
                              <span className="text-[9px] font-black text-taja-primary uppercase bg-taja-primary/5 px-2 py-0.5 rounded-full tracking-widest">
                                {item.variantName}
                              </span>
                            </div>
                          )}
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-black text-taja-secondary text-xs shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subtotal</span>
                      <span className="font-bold text-taja-secondary">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                          Shipping
                        </span>
                        {shippingQuoteMeta?.zone && (
                          <span className="text-[9px] font-bold text-gray-400 mt-1 block leading-snug">
                            {shippingQuoteMeta.zone}
                            {shippingQuoteMeta.estimate ? " · estimate" : ""}
                          </span>
                        )}
                        {shippingQuoteMeta?.note && (
                          <span className="text-[8px] font-medium text-gray-400 mt-1 block leading-relaxed">
                            {shippingQuoteMeta.note}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-taja-secondary shrink-0">{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">VAT (7.5%)</span>
                      <span className="font-bold text-taja-secondary">{formatCurrency(tax)}</span>
                    </div>

                    {/* Coupon */}
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <Input
                        placeholder="COUPON CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="pl-9 rounded-2xl h-11 bg-gray-50 border-transparent text-[10px] font-black uppercase tracking-widest"
                      />
                    </div>

                    {/* Total + CTA */}
                    <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100">
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Amount</p>
                          <p className="text-3xl font-black text-taja-secondary tracking-tighter">{formatCurrency(orderTotal)}</p>
                        </div>
                        <Zap className="w-6 h-6 text-taja-primary mb-1 animate-pulse" />
                      </div>

                      <Button
                        onClick={handlePlaceOrder}
                        disabled={loading || !selectedAddress}
                        className="w-full rounded-[2rem] h-16 font-black uppercase tracking-widest text-xs shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Complete Purchase
                          </>
                        )}
                      </Button>

                      {!selectedAddress && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center mt-3">
                          Add a delivery address to proceed
                        </p>
                      )}

                      <div className="flex items-center justify-center gap-2 mt-6">
                        <ShieldCheck className="w-3 h-3 text-gray-300" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Escrow Protected Transaction</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </ProtectedRoute>
  );
}
