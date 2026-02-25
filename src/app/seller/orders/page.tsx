"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ShoppingCart,
    Search,
    Filter,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    Eye,
    ArrowRight,
    MoreVertical,
    Calendar,
    CreditCard,
    User,
    ArrowUpRight,
    ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { checkoutApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    date: string;
    items: OrderItem[];
    paymentStatus: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SellerOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await checkoutApi.getOrders({
                    role: "seller",
                    limit: 100,
                });

                if (response?.success && response?.data?.orders) {
                    const mappedOrders: Order[] = response.data.orders.map((order: any) => ({
                        id: order._id,
                        orderNumber: order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`,
                        customerName: order.buyer?.fullName || order.shippingAddress?.fullName || "Customer",
                        total: order.totals?.total || order.total || 0,
                        status: order.status || "pending",
                        date: order.createdAt || new Date().toISOString(),
                        paymentStatus: order.paymentStatus || "pending",
                        items: order.items?.map((item: any) => ({
                            id: item.product?._id || item.product || Math.random().toString(),
                            name: item.title || item.product?.title || "Product",
                            quantity: item.quantity || 1,
                            price: item.price || 0,
                            image: item.image || item.product?.images?.[0] || "/placeholder-product.jpg",
                        })) || [],
                    }));
                    setOrders(mappedOrders);
                    setFilteredOrders(mappedOrders);
                }
            } catch (error) {
                console.error("Failed to fetch seller orders:", error);
                toast.error("Failed to load orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    useEffect(() => {
        let filtered = orders;
        if (searchTerm) {
            filtered = filtered.filter(
                (o) =>
                    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
        }
        setFilteredOrders(filtered);
    }, [searchTerm, statusFilter, orders]);

    const getStatusDisplay = (status: string) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return {
                    icon: CheckCircle,
                    label: "Delivered",
                    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                };
            case "shipped":
                return {
                    icon: Truck,
                    label: "Shipped",
                    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                };
            case "processing":
                return {
                    icon: Clock,
                    label: "Processing",
                    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                };
            case "pending":
                return {
                    icon: ShoppingBag,
                    label: "Pending",
                    className: "bg-violet-500/10 text-violet-500 border-violet-500/20",
                };
            case "cancelled":
                return {
                    icon: XCircle,
                    label: "Cancelled",
                    className: "bg-red-500/10 text-red-500 border-red-500/20",
                };
            default:
                return {
                    icon: Package,
                    label: status || "Unknown",
                    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
                };
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-taja-primary/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-taja-primary rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">
                    Loading Orders...
                </p>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-10 py-10"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-end gap-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic">
                            Order <span className="text-taja-primary">Management</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
                        Managing <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">{orders.length} Total Shipments</span> • Live Updates
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="grid grid-cols-3 gap-4 flex-1 lg:flex-none">
                        {[
                            { label: "Pending", value: orders.filter(o => o.status === "pending").length, color: "text-violet-500" },
                            { label: "Active", value: orders.filter(o => ["processing", "shipped"].includes(o.status)).length, color: "text-amber-500" },
                            { label: "Completed", value: orders.filter(o => o.status === "delivered").length, color: "text-emerald-500" },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-4 border-white/60 min-w-[100px] text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Filters & Search */}
            <motion.div variants={item} className="glass-panel p-6 border-white/60 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative group md:col-span-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-taja-primary transition-colors" />
                    <Input
                        placeholder="Search Order ID or Customer Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 h-14 w-full glass-card border-white/60 focus:border-taja-primary/40 focus:ring-0 transition-all text-sm font-medium tracking-wide"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-12 w-full h-14 glass-card border-white/60 text-[10px] font-black uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
                    >
                        <option value="all">Status: All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <Button variant="outline" className="h-14 rounded-[20px] border-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-taja-secondary transition-all">
                    <Calendar className="mr-2 h-4 w-4" /> Filter by Date
                </Button>
            </motion.div>

            {/* Orders List */}
            <motion.div variants={item} className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="glass-card p-24 border-white/60 text-center border-dashed rounded-[40px]">
                        <ShoppingCart className="h-20 w-20 text-taja-light/30 mx-auto mb-8 animate-pulse" />
                        <h3 className="text-3xl font-black text-taja-secondary tracking-tight mb-4 text-white/80">No Orders Found</h3>
                        <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">There are currently no orders that match your criteria.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = getStatusDisplay(order.status);
                        return (
                            <Link key={order.id} href={`/seller/orders/${order.id}`} className="group block">
                                <div className="glass-card px-8 py-6 border-white/60 hover:shadow-premium transition-all duration-300 flex flex-col md:flex-row md:items-center gap-8 rounded-[32px] overflow-hidden relative">
                                    {/* Background Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                                    {/* Order Identity */}
                                    <div className="flex items-center gap-6 md:w-1/4">
                                        <div className="w-14 h-14 rounded-2xl bg-taja-primary/5 flex items-center justify-center text-taja-primary border border-taja-primary/10 shrink-0 group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
                                            <status.icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-taja-primary uppercase tracking-[0.2em] mb-1">
                                                Order {order.orderNumber}
                                            </p>
                                            <h4 className="text-base font-black text-taja-secondary truncate">{order.customerName}</h4>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex -space-x-3 mb-2">
                                            {order.items.slice(0, 3).map((item, i) => (
                                                <div key={i} className="relative w-10 h-10 rounded-xl border-2 border-white bg-motif-blanc overflow-hidden shadow-sm">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="relative w-10 h-10 rounded-xl border-2 border-white bg-taja-secondary flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                            {order.items.map(i => i.name).join(", ")}
                                        </p>
                                    </div>

                                    {/* Financial & Status */}
                                    <div className="flex items-center justify-between md:justify-end gap-10">
                                        <div className="text-left md:text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                            <p className="text-lg font-black text-taja-secondary tracking-tight">₦{order.total.toLocaleString()}</p>
                                        </div>

                                        <div className="hidden lg:block min-w-[140px]">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border shadow-sm flex items-center justify-center gap-2 ${status.className}`}>
                                                <status.icon className="h-3 w-3" />
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</p>
                                            <div className="flex items-center text-[10px] font-black text-taja-primary uppercase tracking-widest gap-2 mt-1">
                                                View Details <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </motion.div>
        </motion.div>
    );
}
