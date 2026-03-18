"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, Filter, Plus, Search, User, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { supportApi } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig = {
  open: { label: "Open", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Clock },
  waiting_customer: { label: "Waiting for User", color: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-100/50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
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
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">Help Desk</h1>
          <p className="text-sm text-slate-500 font-medium">Monitor and resolve help requests from across the platform</p>
        </div>
        <Link href="/support">
          <Button variant="outline" className="rounded-2xl border-gray-200 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all font-bold">
            <Plus className="h-4 w-4 mr-2" />
            New Request (as user)
          </Button>
        </Link>
      </div>

      <Card className="bg-white/60 backdrop-blur-xl border-white shadow-sm overflow-hidden rounded-[2rem]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search subject, user or ticket #..."
                className="w-full pl-11 pr-4 h-12 bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none"
              />
            </div>

            <select
              value={filters.assignedTo}
              onChange={(e) => setFilter("assignedTo", e.target.value)}
              className="h-12 bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-semibold px-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            >
              <option value="">All Staff</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              className="h-12 bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-semibold px-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilter("priority", e.target.value)}
              className="h-12 bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-semibold px-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            >
              <option value="">All Levels</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative h-5 w-5 rounded-lg border-2 border-slate-200 group-hover:border-emerald-400 transition-colors flex items-center justify-center bg-white overflow-hidden">
                <input
                  type="checkbox"
                  checked={filters.unreadOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, unreadOnly: e.target.checked }))}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {filters.unreadOnly && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />}
              </div>
              <span className="text-sm text-slate-600 font-bold">Unread Only</span>
            </label>
            <div className="text-[11px] text-slate-400 font-medium">
              Note: <span className="text-rose-500">Needs reply</span> means the user spoke last.
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
               <div
                key={t._id}
                onClick={() => router.push(`/admin/support/tickets/${t._id}`)}
                className="bg-white/60 backdrop-blur-sm border border-slate-100 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all cursor-pointer rounded-3xl p-6 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        #{t.ticketNumber}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 truncate max-w-[50ch] group-hover:text-emerald-700 transition-colors">
                        {t.subject}
                      </h3>
                      <Badge className={cn("px-3 py-1 rounded-xl font-bold border", status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1.5" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {unread && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                          New Message
                        </span>
                      )}
                      {needsReply && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                          Needs Reply
                        </span>
                      )}
                      {t.priority && (
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                          t.priority === 'urgent' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                          t.priority === 'high' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                          'text-slate-500 bg-slate-50 border-slate-100'
                        )}>
                          {t.priority}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 pr-4">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Created {timeAgo(t.createdAt)}
                      </span>
                      {t.user?.fullName && (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <User className="h-3 w-3" />
                          {t.user.fullName}
                        </span>
                      )}
                      {t.assignedTo?.fullName && (
                        <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle className="h-3 w-3" />
                          Assigned: {t.assignedTo.fullName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {actionable && (
                      <div className="flex items-center gap-2 mr-2 pr-2 border-r border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 font-bold text-xs"
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
                          Claim
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 font-bold text-xs"
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
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-6 rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/support/tickets/${t._id}`);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              </div>
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

