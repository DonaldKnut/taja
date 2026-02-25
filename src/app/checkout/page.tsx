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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { checkoutApi, usersApi, cartApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";

interface CartItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  images: string[];
  seller?: string;
  shopSlug?: string;
}

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
  const [shippingCost, setShippingCost] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);

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
    // Calculate subtotal
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(total);
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      router.push("/marketplace");
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
        paymentMethod: selectedPaymentMethod || undefined,
        couponCode: couponCode || undefined,
      };

      const response = await checkoutApi.createOrder(orderData);

      if (response?.success !== false) {
        const orderId = response?.data?.order?._id || response?.order?._id || response?.data?._id || response?._id;

        if (orderId) {
          // If payment method is not COD, initialize payment
          const isOnlinePayment = !selectedPaymentMethod || selectedPaymentMethod === "paystack" || selectedPaymentMethod === "";

          if (isOnlinePayment) {
            try {
              // Initialize payment
              const paymentResponse = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId,
                  provider: selectedPaymentMethod === "paystack" ? "paystack" : "flutterwave",
                }),
              });

              const paymentData = await paymentResponse.json();

              if (paymentData?.success && paymentData?.data?.paymentUrl) {
                // Clear cart before redirecting to payment
                clearCart();
                await cartApi.clearCart();

                // Redirect to payment gateway
                window.location.href = paymentData.data.paymentUrl;
                return;
              } else {
                // Payment initialization failed, but order was created
                toast.error("Order created but payment initialization failed. Please try paying from order details.");
              }
            } catch (paymentError: any) {
              console.error("Payment initialization error:", paymentError);
              toast.error("Order created but payment initialization failed. Please try paying from order details.");
            }
          } else {
            // COD - just clear cart and redirect
            clearCart();
            await cartApi.clearCart();
            toast.success("Order placed successfully!");
          }

          if (user?.role === "seller") {
            router.push("/seller/purchases");
          } else {
            router.push(orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders");
          }
        } else {
          router.push(user?.role === "seller" ? "/seller/purchases" : "/dashboard/orders");
        }
      } else {
        toast.error(response?.message || response?.error || "Failed to place order");
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error(error?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const total = subtotal + shippingCost - discount;

  if (cartItems.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Logo size="md" variant="header" />
            </div>
          </header>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Add some items to your cart to proceed with checkout.</p>
              <Link href="/marketplace">
                <Button size="lg" variant="gradient">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" variant="header" />
              <Link href="/marketplace">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="mt-2 text-gray-600">Review your order and complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                </div>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address: any) => (
                      <label
                        key={address._id || address.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress === (address._id || address.id)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address._id || address.id}
                          checked={selectedAddress === (address._id || address.id)}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {address.fullName || address.full_name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {address.line1 || address.street || address.addressLine1}
                            {address.line2 && `, ${address.line2}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.postalCode || address.postal_code || ""}
                          </div>
                          <div className="text-sm text-gray-600">{address.country}</div>
                        </div>
                      </label>
                    ))}
                    <Link href={user?.role === "seller" ? "/seller/addresses" : "/dashboard/addresses"}>
                      <Button variant="outline" size="sm" className="w-full">
                        Add New Address
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No addresses found</p>
                    <Link href={user?.role === "seller" ? "/seller/addresses" : "/dashboard/addresses"}>
                      <Button variant="outline">Add Address</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all cursor-pointer ${selectedPaymentMethod === "paystack" || !selectedPaymentMethod || selectedPaymentMethod === ""
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-gray-100 opacity-60"
                      }`}
                    onClick={() => setSelectedPaymentMethod("paystack")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Online Payment</p>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Paystack • Secure Transfer</p>
                      </div>
                    </div>
                    {(selectedPaymentMethod === "paystack" || !selectedPaymentMethod || selectedPaymentMethod === "") && (
                      <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all cursor-pointer ${selectedPaymentMethod === "cod"
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-gray-100 opacity-60"
                      }`}
                    onClick={() => setSelectedPaymentMethod("cod")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Truck className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Cash on Delivery</p>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pay upon receipt</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === "cod" && (
                      <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] leading-relaxed">
                    Premium encrypted transactions. Your data is never stored on our servers.
                    Redirecting to secure gateway upon confirmation.
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                </div>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">₦{item.price.toLocaleString()} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {shippingCost === 0 ? "Free" : `₦${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>-₦{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mb-6">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (!couponCode) return;
                      try {
                        const response = await checkoutApi.applyCoupon(couponCode);
                        if (response?.success !== false) {
                          const discountAmount = response?.data?.discount || response?.discount || 0;
                          setDiscount(discountAmount);
                          toast.success("Coupon applied successfully!");
                        } else {
                          toast.error(response?.message || "Invalid coupon code");
                        }
                      } catch (error: any) {
                        toast.error(error?.message || "Failed to apply coupon");
                      }
                    }}
                  >
                    Apply Coupon
                  </Button>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress || cartItems.length === 0}
                  variant="gradient"
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your payment is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
