"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Store,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: number;
  color?: string;
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-emerald-600 bg-emerald-50 border-emerald-100",
    yellow: "text-amber-600 bg-amber-50 border-amber-100",
    red: "text-rose-600 bg-rose-50 border-rose-100",
    purple: "text-indigo-600 bg-indigo-50 border-indigo-100",
  };

  return (
    <Card className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500 group overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className={`p-4 rounded-2xl border ${colorClasses[color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          {change && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" />
              {change}% Velocity
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

interface Stats {
  users: {
    total: number;
    sellers: number;
    buyers: number;
    active: number;
    banned: number;
    suspended: number;
    recent: number;
  };
  shops: {
    total: number;
    pending?: number;
  };
  products: {
    total: number;
  };
  kyc: {
    pending: number;
  };
  orders: {
    total: number;
  };
  revenue: {
    total: number;
  };
  escrow?: {
    heldAmount: number;
    releasedAmount: number;
    ordersHeldCount: number;
  };
}

interface PendingKYC {
  userId: string;
  fullName: string;
  email: string;
  kyc: {
    businessName: string;
    submittedAt: string;
  };
}

interface PendingShop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  owner: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  } | null;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  buyer: { fullName: string; email?: string };
  shop?: { shopName: string };
  totals: { total: number };
  status: string;
  paymentStatus?: string;
  escrowStatus?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingKyc, setPendingKyc] = useState<PendingKYC[]>([]);
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [submittingShopId, setSubmittingShopId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, kycResponse, shopsResponse, ordersResponse] = await Promise.all([
        api("/api/admin/stats"),
        api("/api/admin/kyc/pending"),
        api("/api/admin/shops/pending"),
        api("/api/admin/orders?page=1&limit=5"),
      ]);

      if (statsResponse?.success) {
        setStats(statsResponse.data);
      }

      if (kycResponse?.success) {
        setPendingKyc(kycResponse.data.slice(0, 5)); // Show only first 5
      }

      if (shopsResponse?.success && Array.isArray(shopsResponse.data)) {
        setPendingShops(shopsResponse.data.slice(0, 5)); // Show only first 5
      }

      if (ordersResponse?.success && Array.isArray(ordersResponse.data?.orders)) {
        setRecentOrders(ordersResponse.data.orders);
      }
    } catch (error: any) {
      console.error("Fetch dashboard error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (
    userId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setSubmitting(userId);
      const response = await api(`/api/admin/kyc/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? "Does not meet requirements" : undefined,
        }),
      });

      if (response?.success) {
        toast.success(`KYC ${action === "approve" ? "approved" : "rejected"} successfully`);
        await fetchDashboardData();
      } else {
        toast.error(response?.message || "Failed to process verification");
      }
    } catch (error: any) {
      console.error("Verification action failed:", error);
      toast.error("Failed to process verification");
    } finally {
      setSubmitting(null);
    }
  };

  const handleShopReview = async (
    shopId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setSubmittingShopId(shopId);
      const response = await api(`/api/admin/shops/${shopId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });

      if (response?.success) {
        toast.success(`Shop ${action === "approve" ? "approved" : "rejected"} successfully`);
        await fetchDashboardData();
      } else {
        toast.error(response?.message || "Failed to review shop");
      }
    } catch (error: any) {
      console.error("Shop review failed:", error);
      toast.error("Failed to review shop");
    } finally {
      setSubmittingShopId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-10 p-1">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
            <Activity className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Overview</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Performance Hub</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <StatCard
          title="Storefronts"
          value={(stats?.shops.total ?? 0).toLocaleString()}
          icon={Store}
          color="green"
        />
        <StatCard
          title="Inventory"
          value={(stats?.products.total ?? 0).toLocaleString()}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Economic Volume"
          value={`₦${stats?.revenue.total ? (stats.revenue.total / 1000000).toFixed(1) : "0"}M`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Authenticity Requests"
          value={(stats?.kyc.pending ?? 0).toLocaleString()}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Store Reviews"
          value={(stats?.shops?.pending ?? 0).toLocaleString()}
          icon={Store}
          color="yellow"
        />
        <StatCard
          title="Safety Blocks"
          value={(stats?.users.banned ?? 0).toLocaleString()}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Funds in Escrow"
          value={`₦${stats?.escrow?.heldAmount ? (stats.escrow.heldAmount / 1_000_000).toFixed(2) : "0"}M`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Orders Held"
          value={(stats?.escrow?.ordersHeldCount ?? 0).toLocaleString()}
          icon={Clock}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Verifications */}
        <div className="lg:col-span-2">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Reviews</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Profiles awaiting authenticity check</p>
                  </div>
                </div>
                <Link href="/admin/kyc">
                  <Button variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9 px-4 border-slate-200">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {pendingKyc.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending verifications
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingKyc.map((verification) => (
                    <div
                      key={verification.userId}
                      className="flex items-center justify-between p-6 bg-slate-50/30 border border-slate-100 rounded-[1.8rem] hover:bg-white hover:shadow-huge transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                            {verification.fullName}
                          </h4>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-0.5 border border-slate-100 rounded-md">
                            {new Date(verification.kyc.submittedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">
                          {verification.email}
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-2 uppercase tracking-tight flex items-center gap-1.5">
                          <Store className="h-3 w-3 text-emerald-500" />
                          {verification.kyc.businessName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleVerification(verification.userId, "approve")
                          }
                          disabled={submitting === verification.userId}
                          className="h-10 px-6 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white border-none font-black uppercase tracking-widest text-[10px] shadow-sm transition-all"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleVerification(verification.userId, "reject")
                          }
                          disabled={submitting === verification.userId}
                          className="h-10 px-6 rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="pending-shops" className="mt-8 rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center">
                    <Store className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Marketplace Applications</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Submissions awaiting review</p>
                  </div>
                </div>
                {pendingShops.length > 0 && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stats?.shops?.pending ?? pendingShops.length} Total
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {pendingShops.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending shops
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingShops.map((shop) => (
                    <div
                      key={shop._id}
                      className="flex items-center justify-between p-6 bg-slate-50/30 border border-slate-100 rounded-[1.8rem] hover:bg-white hover:shadow-huge transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                            {shop.shopName}
                          </h4>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-0.5 border border-slate-100 rounded-md shrink-0">
                            {new Date(shop.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        {shop.owner && (
                          <p className="text-sm font-bold text-slate-400">
                            {shop.owner.fullName} · <span className="text-slate-900 font-black italic">{shop.owner.email}</span>
                          </p>
                        )}
                        {shop.description && (
                          <p className="text-xs font-medium text-slate-500 truncate mt-2 leading-relaxed">
                            "{shop.description}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-6 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleShopReview(shop._id, "approve")}
                          disabled={submittingShopId === shop._id}
                          className="h-10 px-6 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white border-none font-black uppercase tracking-widest text-[10px] shadow-sm transition-all"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShopReview(shop._id, "reject")}
                          disabled={submittingShopId === shop._id}
                          className="h-10 px-6 rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Platform Overview */}
          <Card className="rounded-[1.8rem] border-slate-100 shadow-huge overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-black tracking-tight text-lg">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Citizens</span>
                  <span className="text-sm font-black text-slate-900">
                    {(stats?.users?.active ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Established Merchants</span>
                  <span className="text-sm font-black text-slate-900">
                    {(stats?.users?.sellers ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Patrons</span>
                  <span className="text-sm font-black text-slate-900">
                    {(stats?.users?.buyers ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Probation</span>
                  <span className="text-sm font-black text-amber-600">
                    {(stats?.users?.suspended ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Terminated</span>
                  <span className="text-sm font-black text-rose-600">
                    {(stats?.users?.banned ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Orders</span>
                  <span className="text-sm font-black text-emerald-600">
                    {(stats?.orders?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem] border-slate-100 shadow-huge overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-slate-900 font-black tracking-tight text-lg uppercase">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Button
                className="w-full justify-start rounded-xl border-slate-100 hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px] h-12"
                variant="outline"
                onClick={() => router.push("/admin/kyc")}
              >
                <ShieldCheck className="h-4 w-4 mr-3 text-emerald-500" />
                Verify Identities ({stats?.kyc.pending || 0})
              </Button>
              <Button
                className="w-full justify-start rounded-xl border-slate-100 hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px] h-12"
                variant="outline"
                onClick={() => document.getElementById("pending-shops")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Store className="h-4 w-4 mr-3 text-emerald-500" />
                Verify Shops ({stats?.shops?.pending ?? 0})
              </Button>
              <Button
                className="w-full justify-start rounded-xl border-slate-100 hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px] h-12"
                variant="outline"
                onClick={() => router.push("/admin/users")}
              >
                <Users className="h-4 w-4 mr-3 text-emerald-500" />
                Users
              </Button>
              <Button
                className="w-full justify-start rounded-xl border-slate-100 hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px] h-12"
                variant="outline"
                onClick={() => router.push("/admin/orders")}
              >
                <ShoppingCart className="h-4 w-4 mr-3 text-emerald-500" />
                Transaction Ledger ({stats?.orders?.total ?? 0})
              </Button>
              <Button
                className="w-full justify-start rounded-xl border-slate-100 hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px] h-12"
                variant="outline"
                onClick={() => router.push("/admin/analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-3 text-emerald-500" />
                Insights
              </Button>
            </CardContent>
          </Card>

          {/* Recent orders – follow payment → escrow → delivery → release */}
          <Card className="rounded-[1.8rem] border-slate-100 shadow-huge overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-black tracking-tight text-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-500" />
                Recent orders
              </CardTitle>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9 px-4 border-slate-200">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No orders yet. New orders will appear here and in your notifications.</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      href="/admin/orders"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">#{order.orderNumber || order._id.slice(-8)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{order.buyer?.fullName} · {order.shop?.shopName || "Shop"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-slate-900">₦{(order.totals?.total ?? 0).toLocaleString()}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${order.paymentStatus === "paid" ? "bg-emerald-400/10 text-emerald-600" : "bg-amber-400/10 text-amber-600"}`}>
                          {order.paymentStatus ?? "—"}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${order.escrowStatus === "released" ? "bg-emerald-400/10 text-emerald-600" : order.escrowStatus === "funded" ? "bg-amber-400/10 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                          {order.escrowStatus ?? "—"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




