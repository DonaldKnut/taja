"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, Clock, CheckCircle, AlertCircle, XCircle, User, Package, Store, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supportApi } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  waiting_customer: { label: "Waiting for You", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchTicket();
    }
  }, [params.id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await supportApi.getTicket(params.id as string);
      if (res.success) {
        setTicket(res.data);
      } else {
        toast.error(res.message || "Ticket not found");
        router.push("/support/tickets");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load ticket");
      router.push("/support/tickets");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (ticket?.status === "closed") {
      toast.error("Cannot send messages to closed tickets");
      return;
    }

    try {
      setSending(true);
      const res = await supportApi.addMessage(params.id as string, {
        content: message.trim(),
      });

      if (res.success) {
        setMessage("");
        await fetchTicket(); // Refresh to get updated ticket
        toast.success("Message sent");
      } else {
        toast.error(res.message || "Failed to send message");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const submitSatisfaction = async () => {
    if (satisfactionRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const res = await supportApi.updateTicket(params.id as string, {
        satisfactionRating,
      });

      if (res.success) {
        toast.success("Thank you for your feedback!");
        await fetchTicket();
      } else {
        toast.error(res.message || "Failed to submit rating");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const status = statusConfig[ticket.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/support/tickets" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tickets
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>#{ticket.ticketNumber}</span>
                <span>•</span>
                <span className="capitalize">{ticket.category}</span>
                <span>•</span>
                <span>Created {timeAgo(ticket.createdAt)}</span>
              </div>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Messages */}
          <div className="lg:col-span-2 space-y-6">
            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
                  {ticket.messages && ticket.messages.length > 0 ? (
                    ticket.messages.map((msg: any, idx: number) => {
                      const isStaff = msg.senderRole === "admin" || msg.senderRole === "seller";
                      const isUser = msg.senderRole === "user";

                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}
                        >
                          <div className="flex-shrink-0">
                            {msg.sender?.avatar ? (
                              <Image
                                src={msg.sender.avatar}
                                alt={msg.sender.fullName || "User"}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-taja-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-taja-primary" />
                              </div>
                            )}
                          </div>
                          <div className={`flex-1 ${isStaff ? "text-right" : ""}`}>
                            <div
                              className={`inline-block p-3 rounded-lg ${
                                isStaff
                                  ? "bg-taja-primary text-white"
                                  : isUser
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-yellow-50 text-gray-900"
                              }`}
                            >
                              <div className="text-sm font-medium mb-1">
                                {msg.sender?.fullName || "Support Team"}
                                {isStaff && <span className="ml-2 text-xs opacity-75">(Staff)</span>}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </div>
                            <div className={`text-xs text-gray-500 mt-1 ${isStaff ? "text-right" : ""}`}>
                              {timeAgo(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-8">No messages yet</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* Reply Box */}
            {ticket.status !== "closed" && (
              <Card>
                <CardContent className="p-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) {
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message... (Cmd/Ctrl + Enter to send)"
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                  />
                  <div className="flex justify-end">
                    <Button onClick={sendMessage} disabled={sending || !message.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Satisfaction Rating (for resolved tickets) */}
            {ticket.status === "resolved" && !ticket.satisfactionRating && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">How was your experience?</h3>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfactionRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= satisfactionRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Button onClick={submitSatisfaction} disabled={satisfactionRating === 0}>
                    Submit Rating
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium capitalize">{ticket.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium capitalize">{ticket.category}</p>
                </div>
                {ticket.assignedTo && (
                  <div>
                    <p className="text-sm text-gray-600">Assigned To</p>
                    <p className="font-medium">{ticket.assignedTo.fullName}</p>
                  </div>
                )}
                {ticket.firstResponseAt && (
                  <div>
                    <p className="text-sm text-gray-600">First Response</p>
                    <p className="font-medium text-sm">{timeAgo(ticket.firstResponseAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Items */}
            {(ticket.relatedOrder || ticket.relatedProduct || ticket.relatedShop) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ticket.relatedOrder && (
                    <Link
                      href={`/dashboard/orders/${ticket.relatedOrder._id}`}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Package className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order</p>
                        <p className="text-xs text-gray-600">#{ticket.relatedOrder.orderNumber}</p>
                      </div>
                    </Link>
                  )}
                  {ticket.relatedProduct && (
                    <Link
                      href={`/product/${ticket.relatedProduct.slug}`}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Package className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ticket.relatedProduct.title}</p>
                        <p className="text-xs text-gray-600">Product</p>
                      </div>
                    </Link>
                  )}
                  {ticket.relatedShop && (
                    <Link
                      href={`/shop/${ticket.relatedShop.shopSlug}`}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Store className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ticket.relatedShop.shopName}</p>
                        <p className="text-xs text-gray-600">Shop</p>
                      </div>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





