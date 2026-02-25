"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  Check,
  Trash2,
  Package,
  MessageSquare,
  CreditCard,
  Star,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  type:
  | "order"
  | "message"
  | "review"
  | "payment"
  | "system"
  | "promotion"
  | "chat"
  | "shop";
  title: string;
  message: string;
  link?: string;
  actionUrl?: string;
  read: boolean;
  priority?: "low" | "normal" | "high" | "urgent";
  imageUrl?: string;
  createdAt: string;
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    if (open) {
      // Fetch all notifications, filtering is done client-side
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
    toast.success("Notification deleted");
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    if (notification.link) {
      router.push(notification.link);
      onClose();
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "message":
      case "chat":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "payment":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case "review":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "shop":
        return <ShoppingBag className="h-5 w-5 text-emerald-500" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-taja-secondary/40 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass-panel border-white/20 shadow-huge rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-white/10"
      >
        {/* Cinematic Backdrop Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-[80px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-white/20 flex items-center justify-center shadow-premium-hover">
              <Bell className="h-5 w-5 text-taja-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-taja-secondary tracking-[0.2em] uppercase">Notifications</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {unreadCount} new update{unreadCount !== 1 ? 's' : ''} to see
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-white/40 text-gray-400 hover:text-taja-secondary hover:border-taja-primary/30 transition-all shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-8 py-5 border-b border-white/10 bg-white/2">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${filter === "all"
              ? "bg-taja-secondary text-white shadow-premium"
              : "text-gray-400 hover:text-taja-secondary hover:bg-white"
              }`}
          >
            Everything
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${filter === "unread"
              ? "bg-emerald-500 text-white shadow-emerald"
              : "text-gray-400 hover:text-emerald-500 hover:bg-white"
              }`}
          >
            New Updates
          </button>
          <div className="flex-1" />
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-[9px] font-black text-taja-primary hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-taja-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Checking for updates...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 px-8 text-center"
              >
                <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-6 border border-black/5 shadow-inner">
                  <Bell className="h-8 w-8 text-gray-200" />
                </div>
                <h3 className="text-sm font-black text-taja-secondary uppercase tracking-[0.2em] mb-2">All caught up</h3>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-[200px]">
                  {filter === "unread" ? "You've successfully addressed all pending items." : "Your notification feed is currently clear."}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, idx) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group relative p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer ${!notification.read
                    ? "bg-white border-taja-primary/20 shadow-premium"
                    : "bg-white/40 border-black/5 hover:border-black/10 hover:bg-white"
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${!notification.read ? "bg-taja-primary/10" : "bg-gray-100"
                        }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.read && (
                              <span className="px-2 py-0.5 rounded-full bg-taja-primary text-[8px] font-black text-white uppercase tracking-widest">New</span>
                            )}
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              {new Date(notification.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <h4 className="text-sm font-black text-taja-secondary tracking-tight mb-1">{notification.title}</h4>
                          <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2">{notification.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-[9px] font-black text-taja-primary hover:text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"
                        >
                          <Check className="h-3 w-3" />
                          Got it
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification._id);
                          }}
                          className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/10 bg-white/5">
          <Button
            onClick={() => router.push("/notifications")}
            className="w-full h-14 rounded-2xl bg-taja-secondary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-huge hover:shadow-premium-hover transition-all"
          >
            View all notifications
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
