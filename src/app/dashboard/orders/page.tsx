"use client";

import { useState, useEffect } from "react";
import { checkoutApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { OrderCard, OrdersEmptyState, OrdersFiltersBar, type DashboardOrder } from "@/components/orders";

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredOrders, setFilteredOrders] = useState<DashboardOrder[]>([]);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await checkoutApi.getOrders({
          page: 1,
          limit: 100,
          role: "buyer",
          ...(statusFilter !== "all" && { status: statusFilter }),
        });

        if (response?.success && response?.data?.orders) {
          const mappedOrders: DashboardOrder[] = response.data.orders.map((order: any) => ({
            id: order._id,
            orderNumber: order.orderNumber || `TJA-${order._id.slice(-8).toUpperCase()}`,
            status: order.status || "pending",
            paymentStatus: order.paymentStatus || "pending",
            total: order.totals?.total || order.total || 0,
            date: order.createdAt || new Date().toISOString(),
            estimatedDelivery: order.delivery?.estimatedDelivery
              ? new Date(order.delivery.estimatedDelivery).toISOString()
              : undefined,
            items: order.items?.map((item: any, index: number) => ({
              id: item.product?._id || item.product || `${order._id}-${index}`,
              name: item.title || item.product?.title || item.product?.name || "Product",
              quantity: item.quantity || 1,
              price: item.price || 0,
              image: item.image || item.product?.images?.[0] || item.product?.image || "/placeholder-product.jpg",
              seller: {
                name: order.seller?.fullName || "Unknown Seller",
                shop: order.shop?.shopName || "Unknown Shop",
              },
            })) || [],
            shippingAddress: {
              street: order.shippingAddress?.addressLine1 || order.shippingAddress?.street || "",
              city: order.shippingAddress?.city || "",
              state: order.shippingAddress?.state || "",
              postalCode: order.shippingAddress?.postalCode || "",
            },
          }));

          setOrders(mappedOrders);
        } else {
          setOrders([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to load orders. Please try again.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user, statusFilter]);

  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (dateRangeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRangeFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= filterDate;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "highest":
          return b.total - a.total;
        case "lowest":
          return a.total - b.total;
        default:
          return dateB - dateA;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateRangeFilter, sortBy]);

  return (
    <div className="space-y-10">
      <OrdersFiltersBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateRangeFilter={dateRangeFilter}
        onDateRangeFilterChange={setDateRangeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Orders Inventory */}
      <div className="space-y-6 min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card animate-pulse rounded-[2rem] p-8 border-white/60 h-48" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <OrdersEmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
        )}
      </div>
    </div>
  );
}


