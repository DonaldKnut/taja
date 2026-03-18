"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, Filter, Plus, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { supportApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_customer: { label: "Waiting Customer", color: "bg-orange-50 text-orange-600 border-orange-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
};

export default function AdminSupportInboxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assignedTo: "",
    status: "",
    category: "",
    priority: "",
    search: "",
    unreadOnly: false,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportApi.getTickets({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      if (res.success) {
        setTickets(res.data.tickets);
        setPagination((p: any) => ({
          ...p,
          total: res.data.pagination.total,
          pages: res.data.pagination.pages,
        }));
      } else {
        toast.error(res.message || "Failed to load tickets");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const setFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p: any) => ({ ...p, page: 1 }));
  };

  const currentAdminId = user?._id;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Support Inbox</h1>
          <p className="text-sm text-slate-500">Manage support tickets across the platform</p>
        </div>
        <Link href="/support">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket (as user)
          </Button>
        </Link>
      </div>

      <Card className="bg-white/80 backdrop-blur border border-gray-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search subject, description, ticket #..."
                className="w-full pl-10 pr-3 h-11 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30"
              />
            </div>

            <select
              value={filters.assignedTo}
              onChange={(e) => setFilter("assignedTo", e.target.value)}
              className="h-11 border border-gray-100 rounded-xl text-sm px-3 bg-white"
            >
              <option value="">All assignments</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              className="h-11 border border-gray-100 rounded-xl text-sm px-3 bg-white"
            >
              <option value="">All status</option>
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilter("priority", e.target.value)}
              className="h-11 border border-gray-100 rounded-xl text-sm px-3 bg-white"
            >
              <option value="">All priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
              <input
                type="checkbox"
                checked={filters.unreadOnly}
                onChange={(e) => setFilters((f) => ({ ...f, unreadOnly: e.target.checked }))}
                className="h-4 w-4"
              />
              Unread only
            </label>
            <div className="text-xs text-slate-400">
              Tip: “Needs reply” means customer spoke last.
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-emerald-500/15 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-14 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2">
              No tickets found
            </div>
            <p className="text-sm text-slate-500">Try adjusting filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets
            .map((t) => {
            const status = statusConfig[t.status as keyof typeof statusConfig] ?? statusConfig.open;
            const StatusIcon = status.icon;
            const lastCustomerAt = t.lastCustomerMessageAt ? new Date(t.lastCustomerMessageAt).getTime() : 0;
            const lastStaffAt = t.lastStaffMessageAt ? new Date(t.lastStaffMessageAt).getTime() : 0;
            const needsReply =
              (t.status === "open" || t.status === "in_progress" || t.status === "waiting_customer") &&
              lastCustomerAt > 0 &&
              lastCustomerAt > lastStaffAt;

            const seenAtMs =
              currentAdminId && Array.isArray(t.seenBy)
                ? (() => {
                    const entry = t.seenBy.find((s: any) => String(s.user) === String(currentAdminId));
                    return entry?.seenAt ? new Date(entry.seenAt).getTime() : 0;
                  })()
                : 0;
            const unread = lastCustomerAt > 0 && lastCustomerAt > seenAtMs;

            const actionable =
              t.status === "open" || t.status === "in_progress" || t.status === "waiting_customer";

            return { t, status, StatusIcon, needsReply, unread, lastCustomerAt, seenAtMs, actionable };
          })
            .filter((row) => (filters.unreadOnly ? row.unread : true))
            .sort((a, b) => {
              // Unread first, then needsReply, then newest customer message, then updatedAt
              if (a.unread !== b.unread) return a.unread ? -1 : 1;
              if (a.needsReply !== b.needsReply) return a.needsReply ? -1 : 1;
              if (a.lastCustomerAt !== b.lastCustomerAt) return b.lastCustomerAt - a.lastCustomerAt;
              const au = a.t.updatedAt ? new Date(a.t.updatedAt).getTime() : 0;
              const bu = b.t.updatedAt ? new Date(b.t.updatedAt).getTime() : 0;
              return bu - au;
            })
            .map(({ t, status, StatusIcon, needsReply, unread, actionable }) => {
            return (
              <Card
                key={t._id}
                onClick={() => router.push(`/admin/support/tickets/${t._id}`)}
                className="bg-white border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                          #{t.ticketNumber}
                        </span>
                        <h3 className="font-black text-slate-900 truncate max-w-[52ch]">{t.subject}</h3>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        {unread && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                            Unread
                          </span>
                        )}
                        {needsReply && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                            Needs reply
                          </span>
                        )}
                        {t.priority && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {t.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{t.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Created {timeAgo(t.createdAt)}</span>
                        {t.user?.fullName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-semibold">{t.user.fullName}</span>
                          </>
                        )}
                        {t.assignedTo?.fullName && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Assigned: {t.assignedTo.fullName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {actionable && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await supportApi.updateTicket(t._id, { assignedTo: "me" });
                                await fetchTickets();
                                toast.success("Assigned to you");
                              } catch (err: any) {
                                toast.error(err.message || "Failed to assign");
                              }
                            }}
                          >
                            Assign to me
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await supportApi.updateTicket(t._id, { status: "resolved" });
                                await fetchTickets();
                                toast.success("Resolved");
                              } catch (err: any) {
                                toast.error(err.message || "Failed to resolve");
                              }
                            }}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await supportApi.updateTicket(t._id, { status: "closed" });
                                await fetchTickets();
                                toast.success("Closed");
                              } catch (err: any) {
                                toast.error(err.message || "Failed to close");
                              }
                            }}
                          >
                            Close
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/support/tickets/${t._id}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination((p: any) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination((p: any) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

