"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Package,
  Truck,
  Lock,
  ShieldCheck,
  ChevronRight,
  Zap,
  Tag,
  AlertCircle,
  Clock,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { checkoutApi, usersApi, cartApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";
import { Container } from "@/components/layout";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [shippingCost, setShippingCost] = useState(2500); // Base premium shipping
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shopId, setShopId] = useState<string | null>(null);
  const [deliverySlots, setDeliverySlots] = useState<Array<any>>([]);
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load addresses
        const addressesRes = await usersApi.getAddresses();
        let addressesData = [];
        if (addressesRes?.data?.addresses) {
          addressesData = addressesRes.data.addresses;
        } else if (addressesRes?.addresses) {
          addressesData = addressesRes.addresses;
        } else if (addressesRes?.data) {
          addressesData = Array.isArray(addressesRes.data) ? addressesRes.data : [];
        } else if (Array.isArray(addressesRes)) {
          addressesData = addressesRes;
        }
        setAddresses(addressesData);

        // Set default address
        const defaultAddr = addressesData.find((a: any) => a.isDefault || a.is_default);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr._id || defaultAddr.id);
        } else if (addressesData.length > 0) {
          setSelectedAddress(addressesData[0]._id || addressesData[0].id);
        }

        // Load payment methods
        const paymentRes = await usersApi.getPaymentMethods();
        let methodsData = [];
        if (paymentRes?.data?.paymentMethods) {
          methodsData = paymentRes.data.paymentMethods;
        } else if (paymentRes?.data?.cards) {
          methodsData = paymentRes.data.cards;
        } else if (paymentRes?.paymentMethods) {
          methodsData = paymentRes.paymentMethods;
        } else if (paymentRes?.cards) {
          methodsData = paymentRes.cards;
        } else if (paymentRes?.data) {
          methodsData = Array.isArray(paymentRes.data) ? paymentRes.data : [];
        } else if (Array.isArray(paymentRes)) {
          methodsData = paymentRes;
        }
        setPaymentMethods(methodsData);

        // Set default payment method
        if (methodsData.length > 0) {
          setSelectedPaymentMethod(methodsData[0]._id || methodsData[0].id);
        }
      } catch (error: any) {
        console.error("Failed to load checkout data:", error);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(total);
  }, [cartItems]);

  useEffect(() => {
    const loadDeliverySlots = async () => {
      try {
        if (!cartItems.length) return;

        // Determine shop from the first product in cart
        const productRes: any = await fetch(`/api/products/${encodeURIComponent(cartItems[0]._id)}`).then((r) => r.json());
        const resolvedShopId = productRes?.data?.shop?._id || productRes?.data?.shop?.id || null;
        if (!resolvedShopId) return;

        setShopId(resolvedShopId);
        const slotsRes: any = await fetch(`/api/shops/${encodeURIComponent(resolvedShopId)}/delivery-slots`).then((r) => r.json());
        if (slotsRes?.success && Array.isArray(slotsRes?.data)) {
          setDeliverySlots(slotsRes.data);
          if (selectedDeliverySlotId && !slotsRes.data.find((s: any) => s.id === selectedDeliverySlotId)) {
            setSelectedDeliverySlotId("");
          }
        }
      } catch (e) {
        console.error("Failed to load delivery slots", e);
      }
    };
    loadDeliverySlots();
  }, [cartItems.length]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: selectedAddress,
        paymentMethod: selectedPaymentMethod || "paystack",
        couponCode: couponCode || undefined,
        deliverySlotId: selectedDeliverySlotId || undefined,
      };

      const response = await checkoutApi.createOrder(orderData);

      if (response?.success !== false) {
        const orderId = response?.data?.order?._id || response?.order?._id || response?.data?._id || response?._id;

        if (orderId) {
          const isOnlinePayment = !selectedPaymentMethod || selectedPaymentMethod === "paystack" || selectedPaymentMethod === "card";

          if (isOnlinePayment) {
            try {
              const paymentResponse = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId,
                  provider: "paystack",
                }),
              });

              const paymentData = await paymentResponse.json();

              if (paymentData?.success && paymentData?.data?.paymentUrl) {
                clearCart();
                await cartApi.clearCart();
                window.location.href = paymentData.data.paymentUrl;
                return;
              }
            } catch (paymentError) {
              console.error("Payment initialization error:", paymentError);
            }
          }

          clearCart();
          await cartApi.clearCart();
          toast.success("Order placed successfully!");
          router.push(user?.role === "seller" ? "/seller/purchases" : `/dashboard/orders/${orderId}`);
        }
      } else {
        toast.error(response?.message || "Failed to place order");
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const total = subtotal + shippingCost - discount;

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
              <h2 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">Your Cart is Pristine.</h2>
              <p className="text-gray-400 font-medium max-w-xs mx-auto">No items found for acquisition. Explore our elite marketplace to begin.</p>
            </div>
            <Link href="/marketplace" className="inline-block">
              <Button size="lg" className="rounded-full px-12 h-16 shadow-premium group">
                <span className="font-black uppercase tracking-widest text-xs">Explore Hub</span>
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
      <div className="min-h-screen bg-[#FDFDFD]">
        <AppHeader />

        <main className="relative z-10 pt-8 pb-32">
          <Container size="lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-taja-primary rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Secure Checkout</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-none">
                  Finalizing Acquisition
                </h1>
                <p className="text-gray-400 font-medium text-sm">Review your curated selection and finalize secure payment.</p>
              </div>
              <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-[2rem] border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-taja-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Escrow Protection</p>
                  <p className="text-[9px] font-bold text-emerald-800/60 uppercase">Funds held securely until delivery</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
              {/* Left Column - Checkout Steps */}
              <div className="lg:col-span-8 space-y-8">
                {/* 1. Shipping Address */}
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-taja-primary/10 rounded-2xl">
                        <MapPin className="w-5 h-5 text-taja-primary" />
                      </div>
                      <h2 className="text-xl font-black text-taja-secondary tracking-tight">Delivery Hub</h2>
                    </div>
                    <Link href="/dashboard/settings" className="text-[10px] font-black text-taja-primary uppercase tracking-widest hover:underline">+ New Address</Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <button
                          key={addr._id}
                          onClick={() => setSelectedAddress(addr._id)}
                          className={cn(
                            "text-left p-6 rounded-3xl border-2 transition-all duration-300 relative group",
                            selectedAddress === addr._id
                              ? "border-taja-primary bg-taja-primary/5 ring-4 ring-taja-primary/5"
                              : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{addr.label || "Residency"}</span>
                            {selectedAddress === addr._id && <CheckCircle className="w-4 h-4 text-taja-primary" />}
                          </div>
                          <p className="font-bold text-taja-secondary leading-tight truncate">{addr.street || addr.address}</p>
                          <p className="text-xs text-gray-400 font-medium mt-1">{addr.city}, {addr.state}</p>
                          {addr.isDefault && (
                            <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-gray-100 text-[8px] font-black uppercase text-gray-400">Primary</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 p-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                        <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No addresses registered</p>
                        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => router.push("/dashboard/settings")}>Configure Residency</Button>
                      </div>
                    )}
                  </div>
                </section>

                {/* 2. Delivery Options */}
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
                      <p className="text-[10px] font-black uppercase text-taja-secondary tracking-widest">Priority Dispatch Scheduled within 24-48 Hours</p>
                    </div>
                  )}
                </section>

                {/* 3. Payment Model */}
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                      <Wallet className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-black text-taja-secondary tracking-tight">Secure Payment</h2>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: "paystack", name: "Card / Transfer", provider: "Paystack", secure: true },
                      { id: "cod", name: "Payment on Arrival", provider: "Escrow", secure: false }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300",
                          selectedPaymentMethod === method.id
                            ? "border-taja-primary bg-taja-primary/5 shadow-lg"
                            : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                            selectedPaymentMethod === method.id ? "bg-taja-primary text-white" : "bg-gray-100 text-gray-400"
                          )}>
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-taja-secondary uppercase tracking-widest text-xs">{method.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">via {method.provider} Security</p>
                          </div>
                        </div>
                        {method.secure && <Lock className="w-4 h-4 text-emerald-500" />}
                        {selectedPaymentMethod === method.id && <CheckCircle className="w-5 h-5 text-taja-primary" />}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-4 space-y-8">
                {/* Order Summary */}
                <section className="glass-panel rounded-[2.5rem] p-8 border-white/60 shadow-premium sticky top-28">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-gray-50 rounded-2xl">
                      <Package className="w-5 h-5 text-taja-secondary" />
                    </div>
                    <h2 className="text-lg font-black text-taja-secondary tracking-tight">Order Insight</h2>
                  </div>

                  <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden relative shrink-0 border border-gray-100">
                          <Image src={item.images[0] || "/placeholder.jpg"} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-taja-secondary text-sm truncate">{item.title}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-taja-secondary text-xs">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subtotal</span>
                      <span className="font-bold text-taja-secondary">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Logistics</span>
                      <span className="font-bold text-taja-secondary">{formatCurrency(shippingCost)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-taja-primary">
                        <span className="text-[10px] font-black uppercase tracking-widest">Redemption</span>
                        <span className="font-bold">-{formatCurrency(discount)}</span>
                      </div>
                    )}

                    <div className="relative pt-4">
                      <Input
                        placeholder="COUPON CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="rounded-2xl h-12 bg-gray-50 border-transparent text-[10px] font-black uppercase tracking-widest"
                      />
                      <button className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 p-2 text-taja-primary">
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Amount</p>
                          <p className="text-3xl font-black text-taja-secondary tracking-tighter">
                            {formatCurrency(total)}
                          </p>
                        </div>
                        <Zap className="w-6 h-6 text-taja-primary mb-2 animate-pulse" />
                      </div>

                      <Button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="w-full rounded-[2rem] h-16 font-black uppercase tracking-widest text-xs shadow-premium bg-gradient-to-r from-taja-primary to-emerald-700 hover:scale-[1.02] transition-transform"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Secure Order Completion
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 mt-6">
                        <ShieldCheck className="w-3.h-3 text-gray-300" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Hub Merchant</span>
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
