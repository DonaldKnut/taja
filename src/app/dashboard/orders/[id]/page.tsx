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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    images: string[];
    price: number;
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
  status?:
    | "pending"
    | "confirmed"
    | "in_transit"
    | "out_for_delivery"
    | "delivered";
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
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "escrowed";
  paymentMethod?: "card" | "bank_transfer" | "ussd";
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
    type?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  billingAddress?: {
    type?: string;
    street: string;
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
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const statusConfig = {
  pending: {
    color: "text-yellow-600 bg-yellow-100 border-yellow-200",
    icon: Clock,
    title: "Order Placed",
    description: "Your order has been placed and is awaiting confirmation",
  },
  confirmed: {
    color: "text-blue-600 bg-blue-100 border-blue-200",
    icon: CheckCircle,
    title: "Confirmed",
    description: "Your order has been confirmed by the seller",
  },
  processing: {
    color: "text-purple-600 bg-purple-100 border-purple-200",
    icon: Package,
    title: "Processing",
    description: "Your order is being prepared for shipment",
  },
  shipped: {
    color: "text-orange-600 bg-orange-100 border-orange-200",
    icon: Truck,
    title: "Shipped",
    description: "Your order has been shipped and is on its way",
  },
  delivered: {
    color: "text-green-600 bg-green-100 border-green-200",
    icon: CheckCircle,
    title: "Delivered",
    description: "Your order has been successfully delivered",
  },
  cancelled: {
    color: "text-red-600 bg-red-100 border-red-200",
    icon: XCircle,
    title: "Cancelled",
    description: "This order has been cancelled",
  },
  refunded: {
    color: "text-gray-600 bg-gray-100 border-gray-200",
    icon: RefreshCw,
    title: "Refunded",
    description: "This order has been refunded",
  },
};

const paymentStatusConfig = {
  pending: {
    color: "text-yellow-600 bg-yellow-100",
    text: "Payment Pending",
  },
  paid: {
    color: "text-green-600 bg-green-100",
    text: "Payment Received",
  },
  failed: {
    color: "text-red-600 bg-red-100",
    text: "Payment Failed",
  },
  refunded: {
    color: "text-gray-600 bg-gray-100",
    text: "Refunded",
  },
  escrowed: {
    color: "text-blue-600 bg-blue-100",
    text: "In Escrow",
  },
};

const deliveryStatusConfig = {
  pending: { text: "Delivery Pending", color: "text-yellow-600" },
  confirmed: { text: "Delivery Confirmed", color: "text-blue-600" },
  in_transit: { text: "In Transit", color: "text-orange-600" },
  out_for_delivery: { text: "Out for Delivery", color: "text-purple-600" },
  delivered: { text: "Delivered", color: "text-green-600" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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
    toast.success("Order updated");
  };

  const cancelOrder = async () => {
    if (!order) return;

    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      await api(`/api/orders/${order._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      });
      toast.success("Order cancelled successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const confirmDeliveryAndRelease = async () => {
    if (!order) return;
    setConfirmingDelivery(true);
    try {
      await api(`/api/orders/${order._id}/confirm-delivery`, { method: "POST" });
      toast.success("Delivery confirmed. Releasing escrow…");
      setReleasingEscrow(true);
      await api("/api/payments/payout", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id, provider: "auto" }),
      });
      toast.success("Escrow released and payout initiated.");
      await fetchOrder();
    } catch (error: any) {
      toast.error(error?.message || "Failed to confirm delivery / release escrow");
      await fetchOrder();
    } finally {
      setReleasingEscrow(false);
      setConfirmingDelivery(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = () => {
    // TODO: Implement invoice download
    toast.success("Invoice download will be available soon");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/dashboard/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusConfig = statusConfig[order.status];
  const paymentStatus = paymentStatusConfig[order.paymentStatus];

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/orders">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOrder}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={printInvoice}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={downloadInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Order Status Banner */}
        <Card className="mb-6 border-2 print:border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${currentStatusConfig.color} border`}
                >
                  <currentStatusConfig.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentStatusConfig.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStatusConfig.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge className={paymentStatus.color}>
                      {paymentStatus.text}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(order.totals.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.image || item.product?.images?.[0] || "/placeholder-product.jpg"}
                          alt={item.title || item.product?.title || "Product"}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.title || item.product?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity} ×{" "}
                          {formatCurrency(item.price)}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatCurrency(item.subtotal || item.price * item.quantity)}
                          </p>
                          {item.product?._id && (
                            <Link
                              href={`/product/${item.product._id}`}
                              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              View Product
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.timeline && order.timeline.length > 0 ? (
                    order.timeline.map((event, index) => {
                      const config =
                        statusConfig[
                          event.status as keyof typeof statusConfig
                        ] || statusConfig.pending;
                      const isLast = index === order.timeline.length - 1;
                      const timestamp =
                        typeof event.timestamp === "string"
                          ? new Date(event.timestamp)
                          : event.timestamp;

                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${config.color}`}
                            >
                              <config.icon className="h-5 w-5" />
                            </div>
                            {!isLast && (
                              <div className="w-px h-12 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <h3 className="font-medium text-gray-900">
                              {config.title}
                            </h3>
                            {event.note && (
                              <p className="text-sm text-gray-600 mt-1">
                                {event.note}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {timestamp.toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No timeline events yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">
                      {order.paymentMethod?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <Badge className={paymentStatus.color}>
                      {paymentStatus.text}
                    </Badge>
                  </div>
                  {order.paymentReference && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Payment Reference</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">
                          {order.paymentReference}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(
                              order.paymentReference!,
                              "Payment reference"
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {order.escrowStatus && (
                    <div>
                      <p className="text-sm text-gray-600">Escrow Status</p>
                      <p className="font-medium capitalize">
                        {order.escrowStatus}
                      </p>
                    </div>
                  )}
                  {order.escrowReference && (
                    <div>
                      <p className="text-sm text-gray-600">Escrow Reference</p>
                      <p className="font-mono text-sm">
                        {order.escrowReference}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(order.totals.subtotal)}
                  </span>
                </div>
                {((order.totals.shippingCost ?? order.totals.shipping) ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {formatCurrency(order.totals.shippingCost ?? order.totals.shipping ?? 0)}
                    </span>
                  </div>
                )}
                {order.totals.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      {formatCurrency(order.totals.tax)}
                    </span>
                  </div>
                )}
                {order.totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.totals.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(order.totals.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Tracking */}
            {order.delivery?.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Tracking Number
                    </p>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <p className="font-mono text-sm">
                        {order.delivery.trackingNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            order.delivery.trackingNumber!,
                            "Tracking number"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {order.delivery.provider && (
                    <div>
                      <p className="text-sm text-gray-600">Delivery Partner</p>
                      <p className="font-medium capitalize">
                        {order.delivery.provider}
                      </p>
                    </div>
                  )}

                  {order.delivery.status && (
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p
                        className={`font-medium ${
                          deliveryStatusConfig[
                            order.delivery.status as keyof typeof deliveryStatusConfig
                          ]?.color || "text-gray-600"
                        }`}
                      >
                        {
                          deliveryStatusConfig[
                            order.delivery.status as keyof typeof deliveryStatusConfig
                          ]?.text || order.delivery.status
                        }
                      </p>
                    </div>
                  )}

                  {order.delivery.currentLocation && (
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.delivery.currentLocation}
                      </p>
                    </div>
                  )}

                  {order.delivery.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Estimated Delivery
                      </p>
                      <p className="font-medium">
                        {new Date(
                          order.delivery.estimatedDelivery
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {order.delivery.actualDelivery && (
                    <div>
                      <p className="text-sm text-gray-600">Delivered On</p>
                      <p className="font-medium">
                        {new Date(
                          order.delivery.actualDelivery
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shop</p>
                  <Link
                    href={`/shop/${order.shop.shopSlug}`}
                    className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    {order.shop.shopName}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Seller</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {order.seller.fullName}
                  </p>
                </div>

                {order.seller.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <a
                      href={`tel:${order.seller.phone}`}
                      className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-4 w-4" />
                      {order.seller.phone}
                    </a>
                  </div>
                )}

                {order.seller.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a
                      href={`mailto:${order.seller.email}`}
                      className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      {order.seller.email}
                    </a>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Link
                    href={`/chat?seller=${order.seller._id}&order=${order._id}`}
                  >
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Seller
                    </Button>
                  </Link>
                  {order.seller.phone && (
                    <a
                      href={`https://wa.me/${order.seller.phone.replace(
                        /[\s\+\-]/g,
                        ""
                      )}?text=${encodeURIComponent(
                        `Hi! I have an inquiry about my order ${order.orderNumber}. Can you help me?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button className="w-full bg-green-500 hover:bg-green-600">
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.buyer.fullName}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  {order.shippingAddress.postalCode && (
                    <p>{order.shippingAddress.postalCode}</p>
                  )}
                  <p>{order.shippingAddress.country}</p>
                  {order.buyer.phone && (
                    <p className="mt-2 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.buyer.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.paymentStatus === "paid" &&
                  order.escrowStatus === "funded" &&
                  order.status !== "delivered" && (
                    <Button
                      className="w-full"
                      onClick={confirmDeliveryAndRelease}
                      disabled={confirmingDelivery || releasingEscrow}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {releasingEscrow
                        ? "Releasing Escrow…"
                        : confirmingDelivery
                        ? "Confirming…"
                        : "Confirm Delivery & Release Escrow"}
                    </Button>
                  )}

                {order.status === "delivered" && (
                  <Link href={`/review?order=${order._id}`}>
                    <Button className="w-full">
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  </Link>
                )}

                {(order.status === "pending" || order.status === "confirmed") && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={cancelOrder}
                    disabled={cancelling}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}

                {order.delivery?.trackingNumber && (
                  <Link href={`/track/${order.delivery.trackingNumber}`}>
                    <Button variant="outline" className="w-full">
                      <Truck className="h-4 w-4 mr-2" />
                      Track Delivery
                    </Button>
                  </Link>
                )}

                <Link href={`/order/${order._id}`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                </Link>

                <Link href={`/support?orderId=${order._id}`}>
                  <Button variant="outline" className="w-full">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Get Help / Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

