"use client";

import { useState, useEffect } from "react";
import {
    Search,
    ShoppingCart,
    Filter,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";

interface Order {
    _id: string;
    orderNumber: string;
    buyer: {
        fullName: string;
        email: string;
        phone: string;
    };
    seller: {
        fullName: string;
        email: string;
    };
    shop: {
        shopName: string;
    };
    items: any[];
    totals: {
        total: number;
    };
    status: string;
    paymentStatus: string;
    escrowStatus?: string;
    createdAt: string;
}

const STATUS_CONFIG = {
    pending: { label: "Review", color: "bg-amber-400/10 text-amber-600 border border-amber-400/20", icon: Clock },
    paid: { label: "Secured", color: "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20", icon: CheckCircle },
    processing: { label: "Manifesting", color: "bg-indigo-400/10 text-indigo-600 border border-indigo-400/20", icon: Package },
    shipped: { label: "In Transit", color: "bg-blue-400/10 text-blue-600 border border-blue-400/20", icon: Truck },
    delivered: { label: "Finalized", color: "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20", icon: CheckCircle },
    cancelled: { label: "Terminated", color: "bg-rose-400/10 text-rose-600 border border-rose-400/20", icon: XCircle },
};

interface OrderStats {
    orders: { total: number };
    revenue: { total: number };
    escrow: { heldAmount: number; releasedAmount: number; ordersHeldCount: number };
}

export default function AdminOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    useEffect(() => {
        api("/api/admin/stats").then((r) => {
            if (r?.success && r.data) setOrderStats(r.data);
        });
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "15",
            });

            if (search.trim()) params.append("search", search.trim());
            if (statusFilter) params.append("status", statusFilter);

            const response = await api(`/api/admin/orders?${params.toString()}`);
            if (response?.success) {
                setOrders(response.data.orders);
                setTotalPages(response.data.pagination.totalPages);
            } else {
                toast.error(response?.message || "Failed to fetch orders");
            }
        } catch (error) {
            toast.error("Error loading orders");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchOrders();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-10 p-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
                            <ShoppingCart className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Global Trade</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transaction Ledger</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-8 pb-8 px-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Volume</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight mt-2">{orderStats?.orders?.total?.toLocaleString() ?? "0"}</h3>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-3 flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4" /> Total orders
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-8 pb-8 px-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protected Capital</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight mt-2">
                                    ₦{orderStats?.escrow?.heldAmount != null ? (orderStats.escrow.heldAmount >= 1_000_000 ? (orderStats.escrow.heldAmount / 1_000_000).toFixed(2) + "M" : orderStats.escrow.heldAmount.toLocaleString()) : "0"}
                                </h3>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-3 flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" /> {orderStats?.escrow?.ordersHeldCount ?? 0} orders held
                                </p>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                                <Package className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500">
                    <CardContent className="pt-8 pb-8 px-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Revenue</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight mt-2">
                                    ₦{orderStats?.revenue?.total != null ? (orderStats.revenue.total >= 1_000_000 ? (orderStats.revenue.total / 1_000_000).toFixed(2) + "M" : orderStats.revenue.total.toLocaleString()) : "0"}
                                </h3>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-3 flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4" /> Delivered orders
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-10 rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-1">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-0">
                        <div className="flex-1 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                placeholder="Search by Order ID, Customer, or Shop..."
                                className="w-full h-16 pl-14 pr-6 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-0 border-t md:border-t-0 md:border-l border-slate-100">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-16 px-8 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors"
                            >
                                <option value="">Filter Status</option>
                                <option value="pending">Pending Review</option>
                                <option value="paid">Authorized (Paid)</option>
                                <option value="shipped">In Transit</option>
                                <option value="delivered">Finalized</option>
                                <option value="cancelled">Terminated</option>
                            </select>
                            <button type="submit" className="h-16 px-10 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all">
                                Filter List
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-slate-100 rounded-[2.5rem] shadow-huge overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patron</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protected Value (NGN)</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Escrow</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest State</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Date</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500 italic">Loading orders...</td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500 italic">No orders found matching your criteria</td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-10 py-5">
                                                <span className="font-black text-base text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 tracking-tight">{order.buyer.fullName}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.buyer.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 tracking-tight">{order.shop?.shopName || 'Marketplace Item'}</span>
                                                    <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">{order.seller.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-slate-900">₦{order.totals.total.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'bg-emerald-400/10 text-emerald-600' : order.paymentStatus === 'pending' ? 'bg-amber-400/10 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {order.paymentStatus ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.escrowStatus === 'released' ? 'bg-emerald-400/10 text-emerald-600' : order.escrowStatus === 'funded' ? 'bg-amber-400/10 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {order.escrowStatus ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.color || 'bg-slate-100 text-slate-400'}`}>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                                    {STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label || order.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-slate-900">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Date</p>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl border-slate-100 hover:bg-slate-950 hover:text-white transition-all">
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Page {page} <span className="text-slate-200 mx-2">/</span> {totalPages}</span>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
