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

  // Initialize SSE or Socket.io for real-time notifications
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    let eventSource: EventSource | null = null;
    
    try {
      // Use SSE (Server-Sent Events) for light-weight real-time updates
      // This is more reliable in many hosting environments than Socket.io
      eventSource = new EventSource(`/api/notifications/stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_notifications") {
            // New items detected, refresh the list
            fetchNotifications();
          }
        } catch (e) {
          console.error("Failed to parse SSE data", e);
        }
      };

      eventSource.onerror = (error) => {
        console.warn("SSE connection error, falling back to polling", error);
        if (eventSource) eventSource.close();
      };
    } catch (error) {
      console.error("Failed to initialize SSE:", error);
    }

    // Existing Socket.io initialization (as fallback)
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "";
    let newSocket: Socket | null = null;
    
    if (socketUrl) {
      try {
        newSocket = io(socketUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
        });

        newSocket.on("new_notification", () => fetchNotifications());
        setSocket(newSocket);
      } catch (e) {
        console.error("Socket error", e);
      }
    }

    return () => {
      if (eventSource) eventSource.close();
      if (newSocket) newSocket.close();
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

  const clearAll = useCallback(async () => {
    try {
      await api("/api/notifications/clear-all", {
        method: "DELETE",
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}






