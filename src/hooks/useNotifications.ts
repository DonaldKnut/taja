"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";

interface Notification {
  _id: string;
  type: 'order' | 'message' | 'review' | 'payment' | 'system' | 'promotion' | 'chat' | 'shop';
  title: string;
  message: string;
  link?: string;
  actionUrl?: string;
  read: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  imageUrl?: string;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api("/api/notifications?limit=50");
      
      if (response?.success && response?.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    // Use the same origin for socket connection (Next.js handles it)
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (!socketUrl) return;

    let newSocket: Socket | null = null;
    
    try {
      newSocket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected for notifications");
      });

      newSocket.on("new_notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Show browser notification if permission granted
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.imageUrl || "/favicon.ico",
          });
        }
      });

      newSocket.on("notifications_marked_read", () => {
        fetchNotifications();
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      newSocket.on("connect_error", (error) => {
        console.log("Socket connection error:", error);
        // Fallback to polling - already handled by fetchNotifications interval
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [fetchNotifications]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll for updates every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api(`/api/notifications/${notificationId}`, {
        method: "PUT",
        body: JSON.stringify({ read: true }),
      });
      
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api("/api/notifications/mark-all-read", {
        method: "PUT",
      });
      
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await api(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      
      const wasUnread = notifications.find((n) => n._id === notificationId && !n.read);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}






