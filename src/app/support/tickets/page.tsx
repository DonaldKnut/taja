"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus, Filter, Search, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supportApi } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  waiting_customer: { label: "Waiting for You", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function TicketsListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchTickets();
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
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination.total,
          pages: res.data.pagination.pages,
        }));
      } else {
        toast.error(res.message || "Failed to load tickets");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Support Tickets</h1>
            <p className="text-gray-600">View and manage all your support requests</p>
          </div>
          <Link href="/support">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
              >
                <option value="">All Status</option>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="order">Order Issue</option>
                <option value="payment">Payment Issue</option>
                <option value="product">Product Question</option>
                <option value="delivery">Delivery Issue</option>
                <option value="refund">Refund Request</option>
                <option value="account">Account Issue</option>
                <option value="technical">Technical Issue</option>
                <option value="general">General Inquiry</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-taja-primary focus:border-transparent"
              >
                <option value="">All Priorities</option>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-6">
                {Object.values(filters).some((f) => f) ? "Try adjusting your filters" : "Create your first support ticket"}
              </p>
              <Link href="/support">
                <Button>Create New Ticket</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig];
              const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig];
              const StatusIcon = status.icon;

              return (
                <Card key={ticket._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/support/tickets/${ticket._id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>#{ticket.ticketNumber}</span>
                          <span>•</span>
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{timeAgo(ticket.createdAt)}</span>
                          {ticket.messages && ticket.messages.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="outline" size="sm">
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}





