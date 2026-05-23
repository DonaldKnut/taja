"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { api, checkoutApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewOrderSummary {
  _id: string;
  orderNumber: string;
  status: string;
  shop: {
    _id: string;
    shopName: string;
    shopSlug: string;
  };
  items: Array<{
    _id: string;
    title: string;
    image?: string;
    price: number;
    quantity: number;
  }>;
}

function LeaveReviewPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<ReviewOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await checkoutApi.getOrder(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          toast.error(res.message || "Order not found");
          router.push(user?.role === "seller" ? "/seller/purchases" : "/dashboard/orders");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load order");
        router.push(user?.role === "seller" ? "/seller/purchases" : "/dashboard/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !order) return;

    if (!comment.trim()) {
      toast.error("Please add a short comment about your experience");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          shopId: order.shop._id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      if (res.success) {
        toast.success("Thank you for reviewing this shop!");
        router.push(`/shop/${order.shop.shopSlug}`);
      } else {
        toast.error(res.message || "Failed to submit review");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading order...</p>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-gray-700 font-medium">Order not found</p>
          <Button onClick={() => router.push(user?.role === "seller" ? "/seller/purchases" : "/dashboard/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Rate your experience with {order.shop.shopName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order summary */}
            <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <p className="text-sm text-gray-600">
                Order #{order.orderNumber}
              </p>
              <ul className="space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <span className="truncate mr-2">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rating stars */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Overall rating
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating} out of 5
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                placeholder="e.g. Great communication and fast delivery"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                placeholder="Share what you liked or what could be better. This helps other buyers and the seller."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LeaveReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <LeaveReviewPageInner />
    </Suspense>
  );
}






