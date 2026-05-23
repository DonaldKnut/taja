"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Trash2,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Helper: Group Notifications by Date ─────────────────────────────────────
const groupNotifications = (notifications: any[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    today: notifications.filter((n: any) => new Date(n.createdAt) >= today),
    yesterday: notifications.filter((n: any) => {
      const d = new Date(n.createdAt);
      return d < today && d >= yesterday;
    }),
    earlier: notifications.filter((n: any) => {
      const d = new Date(n.createdAt);
      return d < yesterday && d >= weekAgo;
    }),
    older: notifications.filter((n: any) => new Date(n.createdAt) < weekAgo)
  };
};

const getNotificationIcon = (type: string, priority: string) => {
  const iconProps = { size: 24, className: "text-white" };
  
  let bgColor = "bg-slate-400";
  let icon = <Bell {...iconProps} />;
  
  switch (type) {
    case "order":
      bgColor = "bg-emerald-500 shadow-emerald-500/20";
      icon = <Package {...iconProps} />;
      break;
    case "payment":
      bgColor = "bg-amber-500 shadow-amber-500/20";
      icon = <DollarSign {...iconProps} />;
      break;
    case "chat":
    case "message":
      bgColor = "bg-blue-500 shadow-blue-500/20";
      icon = <MessageSquare {...iconProps} />;
      break;
    case "review":
      bgColor = "bg-purple-500 shadow-purple-500/20";
      icon = <Star {...iconProps} />;
      break;
    case "shop":
      bgColor = "bg-taja-primary shadow-taja-primary/20";
      icon = <ShoppingBag {...iconProps} />;
      break;
    case "system":
      bgColor = priority === "urgent" ? "bg-rose-500 shadow-rose-500/20" : "bg-slate-500 shadow-slate-500/20";
      icon = <AlertTriangle {...iconProps} />;
      break;
  }

  return (
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-500", bgColor)}>
      {icon}
    </div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n: any) => !n.read) : notifications;

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    toast.success("Notification removed");
  };

  const handleClearAll = async () => {
    await clearAll();
    toast.success("All notifications cleared");
  };

  const handleNotificationClick = (notification: {
    _id: string;
    read: boolean;
    link?: string;
    actionUrl?: string;
  }) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    const target = notification.link || notification.actionUrl;
    if (target) {
      router.push(target);
    }
  };

  const groups = groupNotifications(filteredNotifications);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden selection:bg-taja-primary/10">
      {/* Neural Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-taja-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[140px] rounded-full animate-float" />
        <div className="absolute inset-0 motif-blanc opacity-[0.06]" />
      </div>

      {/* Premium Header */}
      <header className="relative z-20 pt-10 pb-6 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3">
            <Link
              href="/seller/dashboard"
              className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-taja-primary transition-all mb-4"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-taja-primary group-hover:text-white transition-all shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[2rem] bg-taja-primary/10 flex items-center justify-center shadow-inner relative group/bell">
                <Bell className="h-8 w-8 text-taja-primary animate-ring" />
                {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-[10px] items-center justify-center text-white font-black">{unreadCount}</span>
                   </span>
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-taja-secondary tracking-tighter leading-none italic">
                  My <span className="text-transparent bg-clip-text bg-gradient-taja drop-shadow-sm">Alerts.</span>
                </h1>
                <p className="text-sm font-medium text-gray-400 tracking-wide mt-2">
                  Stay updated with news from your shop and buyers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {notifications.length > 0 && (
               <Button
                 variant="ghost"
                 onClick={handleClearAll}
                 className="rounded-2xl h-14 px-8 border border-red-50 text-red-500 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest gap-2"
               >
                 <Trash2 className="h-4 w-4" /> Delete All
               </Button>
             )}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-10 pb-32">
        {/* Modern Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center bg-gray-50/80 backdrop-blur-xl p-1.5 rounded-[2rem] border border-gray-100 shadow-sm">
            <button
               onClick={() => setFilter("all")}
               className={cn(
                 "px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                 filter === "all" ? "bg-white text-taja-secondary shadow-premium-sm" : "text-gray-400 hover:text-gray-600"
               )}
            >
              All Alerts <span className="ml-1 opacity-40">({notifications.length})</span>
            </button>
            <button
               onClick={() => setFilter("unread")}
               className={cn(
                 "px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                 filter === "unread" ? "bg-white text-taja-secondary shadow-premium-sm" : "text-gray-400 hover:text-gray-600"
               )}
            >
              Unread <span className="ml-1 opacity-40">({unreadCount})</span>
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              className="rounded-full h-12 px-8 border-gray-100 hover:bg-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              <CheckCheck className="h-4 w-4 mr-2 text-emerald-500" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Dynamic Groups List */}
        <div className="space-y-16">
          {loading ? (
             <div className="min-h-[400px] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                   <div className="w-16 h-16 rounded-full border-2 border-gray-100 animate-pulse bg-gray-50 shadow-inner" />
                   <div className="absolute inset-0 border-t-2 border-taja-primary rounded-full animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Scanning Neural Alerts…</p>
             </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="min-h-[500px] glass-panel rounded-[4rem] flex flex-col items-center justify-center border-white/60 text-center px-6">
               <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 rotate-12 shadow-inner">
                  <BellOff className="h-10 w-10 text-gray-200" />
               </div>
               <h3 className="text-4xl font-black text-taja-secondary tracking-tighter italic mb-4">
                 All Clear!
               </h3>
               <p className="text-gray-400 font-medium text-lg max-w-xs mx-auto leading-relaxed">
                 {filter === "unread" 
                   ? "You have already read all your recent news and updates."
                   : "No alerts or news for you right now. We will notify you when something happens."}
               </p>
            </div>
          ) : (
            Object.entries(groups).map(([key, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={key} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-taja-primary" />
                      {key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key === 'earlier' ? 'Earlier This Week' : 'Older Alerts'}
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                      {list.map((notification) => (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          layout
                          className="group relative"
                        >
                          <div
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "relative z-10 glass-panel rounded-[2.5rem] p-6 transition-all duration-500 cursor-pointer border-white/60 hover:shadow-premium group",
                              !notification.read ? "bg-emerald-50/30 border-emerald-100 shadow-premium-sm" : "hover:bg-gray-50 shadow-sm"
                            )}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                              <div className="flex items-start sm:items-center gap-6 flex-1 min-w-0">
                                {getNotificationIcon(notification.type, notification.priority || "normal")}
                                
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                     <h3 className={cn("text-[13px] font-black tracking-tight flex-1 sm:flex-none truncate", !notification.read ? "text-taja-secondary" : "text-gray-500")}>
                                        {notification.title}
                                     </h3>
                                     {!notification.read && (
                                       <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest animate-pulse">New Alert</span>
                                     )}
                                     {notification.priority === "urgent" && (
                                       <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-widest">Urgent</span>
                                     )}
                                  </div>
                                  <p className={cn("text-xs font-medium leading-relaxed max-w-2xl line-clamp-2", !notification.read ? "text-gray-700" : "text-gray-400")}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                                     {timeAgo(new Date(notification.createdAt))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification._id);
                                    }}
                                    className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    title="Keep as Read"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification._id);
                                  }}
                                  className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Show More */}
        {filteredNotifications.length >= 50 && (
          <div className="text-center mt-20">
            <Button variant="outline" className="rounded-full px-12 h-14 border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-white shadow-sm transition-all">
              Show More History
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
