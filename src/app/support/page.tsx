"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { MessageSquare, FileText, AlertCircle, Package, CreditCard, User, Truck, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supportApi } from "@/lib/api";
import toast from "react-hot-toast";

const categories = [
  { value: "order", label: "Order Issue", icon: Package, description: "Problems with your order" },
  { value: "payment", label: "Payment Issue", icon: CreditCard, description: "Payment or refund questions" },
  { value: "product", label: "Product Question", icon: Package, description: "Questions about a product" },
  { value: "delivery", label: "Delivery Issue", icon: Truck, description: "Shipping or delivery problems" },
  { value: "refund", label: "Refund Request", icon: RefreshCw, description: "Request a refund" },
  { value: "account", label: "Account Issue", icon: User, description: "Account or profile problems" },
  { value: "technical", label: "Technical Issue", icon: AlertCircle, description: "Website or app problems" },
  { value: "general", label: "General Inquiry", icon: HelpCircle, description: "Other questions" },
];

const priorities = [
  { value: "low", label: "Low", description: "Not urgent" },
  { value: "medium", label: "Medium", description: "Normal priority" },
  { value: "high", label: "High", description: "Urgent - needs quick response" },
  { value: "urgent", label: "Urgent", description: "Critical - immediate attention needed" },
];

function SupportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get("orderId");
  const prefillProductId = searchParams.get("productId");
  const prefillShopId = searchParams.get("shopId");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: prefillOrderId ? "order" : prefillProductId ? "product" : "general",
    priority: "medium",
    relatedOrderId: prefillOrderId || "",
    relatedProductId: prefillProductId || "",
    relatedShopId: prefillShopId || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const res = await supportApi.createTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        relatedOrderId: formData.relatedOrderId || undefined,
        relatedProductId: formData.relatedProductId || undefined,
        relatedShopId: formData.relatedShopId || undefined,
      });

      if (res.success) {
        toast.success("Support ticket created! We'll get back to you soon.");
        router.push(`/support/tickets/${res.data._id}`);
      } else {
        toast.error(res.message || "Failed to create ticket");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Support</h1>
          <p className="text-gray-600">
            We're here to help! Create a support ticket and our team will respond as soon as possible.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What can we help you with? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.category === cat.value
                            ? "border-taja-primary bg-taja-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-2 text-taja-primary" />
                        <div className="font-medium text-sm">{cat.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} - {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                  placeholder="Brief description of your issue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                  placeholder="Please provide as much detail as possible about your issue. Include order numbers, product names, or any relevant information that can help us assist you faster."
                />
                <p className="text-xs text-gray-500 mt-1">
                  The more details you provide, the faster we can help you!
                </p>
              </div>

              {/* Related IDs (hidden if not prefilled) */}
              {formData.relatedOrderId && (
                <input type="hidden" name="relatedOrderId" value={formData.relatedOrderId} />
              )}
              {formData.relatedProductId && (
                <input type="hidden" name="relatedProductId" value={formData.relatedProductId} />
              )}
              {formData.relatedShopId && (
                <input type="hidden" name="relatedShopId" value={formData.relatedShopId} />
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/support/tickets")}
                >
                  View My Tickets
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Ticket..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Tips */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">💡 Tips for Faster Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Include order numbers or product names when relevant</li>
              <li>• Be specific about what you need help with</li>
              <li>• Check your email for our response (we usually reply within 24 hours)</li>
              <li>• You can view all your tickets in "My Tickets"</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <SupportPageInner />
    </Suspense>
  );
}





