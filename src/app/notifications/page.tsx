"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Package,
  MessageSquare,
  Star,
  DollarSign,
  AlertTriangle,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  type:
    | "order"
    | "payment"
    | "chat"
    | "review"
    | "shop"
    | "system"
    | "promotion";
  title: string;
  message: string;
  read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  imageUrl?: string;
  createdAt: Date;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    _id: "1",
    type: "order",
    title: "New Order Received!",
    message: "You have a new order (#TJS001234) worth ₦25,000",
    read: false,
    priority: "high",
    actionUrl: "/seller/orders/1",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    _id: "2",
    type: "payment",
    title: "Payment Received",
    message: "Payment of ₦18,500 has been processed for order #TJS001230",
    read: false,
    priority: "normal",
    actionUrl: "/seller/orders/2",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    _id: "3",
    type: "chat",
    title: "New Message",
    message: 'Kemi sent you a message about "Vintage Denim Jacket"',
    read: true,
    priority: "normal",
    actionUrl: "/chat/3",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    _id: "4",
    type: "review",
    title: "New Review Received",
    message: "Your shop received a 5-star review from Chinedu Okafor",
    read: true,
    priority: "normal",
    actionUrl: "/seller/reviews",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    _id: "5",
    type: "system",
    title: "Welcome to Taja.Shop!",
    message: "Complete your shop verification to unlock all features",
    read: true,
    priority: "low",
    actionUrl: "/seller/verification",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const getNotificationIcon = (type: string, priority: string) => {
  const iconProps = {
    size: 20,
    className:
      priority === "urgent"
        ? "text-red-500"
        : priority === "high"
        ? "text-orange-500"
        : "text-gray-500",
  };

  switch (type) {
    case "order":
      return <Package {...iconProps} />;
    case "payment":
      return <DollarSign {...iconProps} />;
    case "chat":
      return <MessageSquare {...iconProps} />;
    case "review":
      return <Star {...iconProps} />;
    case "system":
      return <AlertTriangle {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
    // TODO: Call API to mark as read
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
      // TODO: Call API to mark all as read
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    toast.success("Notification deleted");
    // TODO: Call API to delete
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/seller/dashboard"
              className="flex items-center space-x-2 text-taja-primary hover:text-taja-primary/80"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>

            <div className="flex items-center space-x-2">
              <Bell className="h-6 w-6 text-taja-primary" />
              <span className="text-xl font-bold text-taja-dark">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>

            <Link href="/notifications/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              size="sm"
            >
              Unread ({unreadCount})
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BellOff className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications"}
                </h3>
                <p className="text-gray-500 text-center">
                  {filter === "unread"
                    ? "All caught up! You have no unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.read
                    ? "border-l-4 border-l-taja-primary bg-taja-primary/5"
                    : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification._id);
                  }
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(
                          notification.type,
                          notification.priority
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-medium ${
                              !notification.read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h3>

                          <div className="flex items-center space-x-2 ml-4">
                            <span className="text-xs text-gray-500">
                              {timeAgo(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-taja-primary rounded-full"></div>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-sm ${
                            !notification.read
                              ? "text-gray-700"
                              : "text-gray-500"
                          }`}
                        >
                          {notification.message}
                        </p>

                        {notification.priority === "urgent" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                            Urgent
                          </span>
                        )}

                        {notification.priority === "high" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="h-8 w-8"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length >= 20 && (
          <div className="text-center mt-8">
            <Button variant="outline">Load More Notifications</Button>
          </div>
        )}
      </div>
    </div>
  );
}













