"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
}

interface DeliveryInfo {
  trackingNumber?: string;
  provider?: string;
  estimatedDelivery?: Date;
  currentLocation?: string;
  status:
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
    phone: string;
  };
  seller: {
    _id: string;
    fullName: string;
    phone: string;
    shop: {
      shopName: string;
      shopSlug: string;
    };
  };
  items: OrderItem[];
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryInfo: DeliveryInfo;
  timeline: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const statusConfig = {
  pending: {
    color: "text-yellow-600 bg-yellow-100",
    icon: Clock,
    title: "Order Placed",
  },
  confirmed: {
    color: "text-blue-600 bg-blue-100",
    icon: CheckCircle,
    title: "Confirmed",
  },
  processing: {
    color: "text-purple-600 bg-purple-100",
    icon: Package,
    title: "Processing",
  },
  shipped: {
    color: "text-orange-600 bg-orange-100",
    icon: Truck,
    title: "Shipped",
  },
  delivered: {
    color: "text-green-600 bg-green-100",
    icon: CheckCircle,
    title: "Delivered",
  },
  cancelled: {
    color: "text-red-600 bg-red-100",
    icon: AlertCircle,
    title: "Cancelled",
  },
};

const deliveryStatusConfig = {
  pending: { text: "Delivery Pending", color: "text-yellow-600" },
  confirmed: { text: "Delivery Confirmed", color: "text-blue-600" },
  in_transit: { text: "In Transit", color: "text-orange-600" },
  out_for_delivery: { text: "Out for Delivery", color: "text-purple-600" },
  delivered: { text: "Delivered", color: "text-green-600" },
};

// Mock order data
const mockOrder: Order = {
  _id: "1",
  orderNumber: "TJS001234567",
  buyer: {
    _id: "1",
    fullName: "Chinedu Okafor",
    phone: "+2348012345678",
  },
  seller: {
    _id: "2",
    fullName: "Amina Hassan",
    phone: "+2347098765432",
    shop: {
      shopName: "Amina Thrift",
      shopSlug: "amina-thrift",
    },
  },
  items: [
    {
      _id: "1",
      product: {
        _id: "1",
        title: "Vintage Denim Jacket",
        images: [
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
        ],
        price: 15000,
      },
      quantity: 1,
      price: 15000,
    },
  ],
  status: "shipped",
  paymentStatus: "paid",
  totalAmount: 15000,
  shippingAddress: {
      street: "12 Admiralty Way",
      city: "Lekki",
      state: "Lagos",
      postalCode: "105102",
    country: "Nigeria",
  },
  deliveryInfo: {
    trackingNumber: "TRK123456789",
    provider: "Gokada Express",
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    currentLocation: "Lagos Distribution Center",
    status: "in_transit",
  },
  timeline: [
    {
      status: "pending",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      note: "Order placed successfully",
    },
    {
      status: "confirmed",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      note: "Order confirmed by seller",
    },
    {
      status: "shipped",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      note: "Package shipped via Gokada Express",
    },
  ],
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(),
};

export default function OrderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      // For now, use mock data
      setOrder(mockOrder);
    } catch (error) {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingNumber = () => {
    if (order?.deliveryInfo.trackingNumber) {
      navigator.clipboard.writeText(order.deliveryInfo.trackingNumber);
      toast.success("Tracking number copied!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Order not found
      </div>
    );
  }

  const timeline = order.timeline || [];
  const currentStatusConfig =
    statusConfig[order.status as keyof typeof statusConfig];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/orders"
              className="flex items-center space-x-2 text-taja-primary hover:text-taja-primary/80"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Orders</span>
            </Link>

            <Logo size="md" variant="header" />

            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {order.createdAt.toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig.color}`}
              >
                <currentStatusConfig.icon className="h-4 w-4 mr-1" />
                {currentStatusConfig.title}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(order.totalAmount)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Order Progress</span>
              <span className="text-sm font-medium text-taja-primary">
                {Math.round(((timeline.length || 0) / 4) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-taja-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(((timeline.length || 0) / 4) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Order Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/chat?seller=${order.seller._id}&product=${order.items[0].product._id}`}
            >
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Seller
              </Button>
            </Link>

            {order.status === "delivered" && (
              <Link href={`/review?order=${order._id}`}>
                <Button className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              </Link>
            )}

            {order.deliveryInfo.trackingNumber && (
              <Button
                variant="outline"
                onClick={copyTrackingNumber}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Tracking #
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.product.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-lg font-semibold text-taja-primary">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <Link href={`/product/${item.product._id}`}>
                        <Button variant="outline" size="sm">
                          View Product
                        </Button>
                      </Link>
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
                  {timeline.map((event, index) => {
                    const config =
                      statusConfig[event.status as keyof typeof statusConfig];
                    const isLast = index === timeline.length - 1;

                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}
                          >
                            <config.icon className="h-5 w-5" />
                          </div>
                          {!isLast && (
                            <div className="w-px h-8 bg-gray-300 mt-2"></div>
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
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery & Contact Info */}
          <div className="space-y-6">
            {/* Delivery Tracking */}
            {order.deliveryInfo.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm">
                        {order.deliveryInfo.trackingNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyTrackingNumber}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                    <p className="font-medium">{order.deliveryInfo.provider}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p
                      className={`font-medium ${
                        deliveryStatusConfig[order.deliveryInfo.status].color
                      }`}
                    >
                      {deliveryStatusConfig[order.deliveryInfo.status].text}
                    </p>
                  </div>

                  {order.deliveryInfo.currentLocation && (
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.deliveryInfo.currentLocation}
                      </p>
                    </div>
                  )}

                  {order.deliveryInfo.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Estimated Delivery
                      </p>
                      <p className="font-medium">
                        {order.deliveryInfo.estimatedDelivery.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seller Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Seller Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Shop</p>
                  <Link
                    href={`/shop/${order.seller.shop.shopSlug}`}
                    className="font-medium text-taja-primary hover:underline"
                  >
                    {order.seller.shop.shopName}
                  </Link>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium">{order.seller.fullName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a
                    href={`tel:${order.seller.phone}`}
                    className="font-medium text-taja-primary hover:underline"
                  >
                    {order.seller.phone}
                  </a>
                </div>

                {/* WhatsApp link if seller has WhatsApp */}
                {order.seller.phone ? (
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
                      Message Seller on WhatsApp
                    </Button>
                  </a>
                ) : (
                  <Link
                    href={`/chat?seller=${order.seller._id}&product=${order.items[0].product._id}`}
                  >
                    <Button className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Seller
                    </Button>
                  </Link>
                )}
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
                <div className="text-sm">
                  <p className="font-medium">{order.buyer.fullName}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p>{order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="mt-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    {order.buyer.phone}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
