"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supportApi } from "@/lib/api";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_customer: { label: "Needs Feedback", color: "bg-orange-50 text-orange-600 border-orange-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "text-gray-400" },
  medium: { label: "Normal", color: "text-blue-500" },
  high: { label: "High", color: "text-orange-500" },
  urgent: { label: "Urgent", color: "text-rose-500" },
};

export default function SellerTicketsListPage() {
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
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/seller/support">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white shadow-sm border border-gray-100 h-14 w-14">
                <ArrowLeft className="h-6 w-6 text-taja-secondary" />
              </Button>
            </Link>
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <Link href="/seller" className="hover:text-taja-primary">Merchant Hub</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/seller/support" className="hover:text-taja-primary">Support</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-taja-secondary">Record</span>
              </nav>
              <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic leading-none">
                Support <span className="text-taja-primary">Inbox</span>
              </h1>
            </div>
          </div>

          <Link href="/seller/support">
            <Button className="h-14 rounded-2xl bg-taja-secondary hover:bg-black text-[10px] font-black uppercase tracking-widest shadow-premium px-8">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Filters Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] p-6 border-white/60 shadow-premium mb-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-11 pr-4 h-12 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-taja-primary/5 focus:border-taja-primary/30 transition-all text-taja-secondary"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 h-12 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-4 focus:ring-taja-primary/5 appearance-none cursor-pointer hover:bg-white transition-all"
            >
              <option value="">All Status</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-4 h-12 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-4 focus:ring-taja-primary/5 appearance-none cursor-pointer hover:bg-white transition-all"
            >
              <option value="">All Categories</option>
              <option value="order">Order Issues</option>
              <option value="payout">Payouts & Wallet</option>
              <option value="shop">Shop Setup</option>
              <option value="technical">Technical Support</option>
              <option value="general">General Inquiry</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-4 h-12 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-4 focus:ring-taja-primary/5 appearance-none cursor-pointer hover:bg-white transition-all"
            >
              <option value="">All Priorities</option>
              {Object.entries(priorityConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Tickets List Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-10 w-10 animate-spin text-taja-primary mb-4" />
            <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">Synchronizing...</p>
          </div>
        ) : tickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="glass-panel rounded-[3rem] p-20 text-center border-dashed border-2 border-gray-100"
          >
            <MessageSquare className="h-20 w-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-taja-secondary tracking-tight mb-4 uppercase italic">No Support Tickets Found</h3>
            <p className="text-gray-400 mb-10 max-w-sm mx-auto font-medium">Your support communication channel is currently empty. Reach out if you need assistance.</p>
            <Link href="/seller/support">
              <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[10px] bg-taja-secondary hover:bg-black transition-all shadow-md">
                Initiate Support Ticket
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket, index) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open;
              const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/seller/support/tickets/${ticket._id}`)}
                  className="group relative glass-panel rounded-[2.5rem] p-8 border-white/60 hover:shadow-premium hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] bg-taja-primary/5 px-3 py-1 rounded-full">
                          #{ticket.ticketNumber}
                        </span>
                        <h3 className="text-lg font-black text-taja-secondary tracking-tight group-hover:text-taja-primary transition-colors">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("rounded-full border px-4 py-1 text-[8px] font-black uppercase tracking-widest", status.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <span className={cn("text-[8px] font-black uppercase tracking-widest px-3", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 font-medium line-clamp-1 max-w-2xl">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3 h-3" />
                          <span>{ticket.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo(ticket.createdAt)}</span>
                        </div>
                        {ticket.messages && ticket.messages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-taja-primary">
                            <MessageSquare className="w-3 h-3" />
                            <span>{ticket.messages.length} Interaction{ticket.messages.length !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex flex-col items-end gap-1">
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Protocol Date</p>
                         <p className="text-xs font-black text-taja-secondary">{formatDate(ticket.createdAt)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-taja-primary/10 group-hover:text-taja-primary transition-all">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <Button
              variant="outline"
              className="rounded-xl border-gray-100 h-12 px-6 text-[10px] font-black uppercase tracking-widest"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-taja-secondary bg-white shadow-sm border border-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">
                {pagination.page}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">of {pagination.pages}</span>
            </div>
            <Button
              variant="outline"
              className="rounded-xl border-gray-100 h-12 px-6 text-[10px] font-black uppercase tracking-widest"
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
