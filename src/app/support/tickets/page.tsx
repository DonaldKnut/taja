"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  RefreshCw,
  Filter,
  ArrowRight,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { supportApi } from "@/lib/api";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_customer: { label: "Waiting for You", color: "bg-rose-50 text-rose-600 border-rose-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "text-gray-400" },
  medium: { label: "Medium", color: "text-blue-500" },
  high: { label: "High", color: "text-orange-500" },
  urgent: { label: "Urgent", color: "text-rose-500" },
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
    limit: 10,
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
    <div className="min-h-screen bg-gray-50/50 selection:bg-taja-primary/30">
      {/* Dynamic Background Accents */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-taja-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-taja-primary/10 rounded-2xl">
                 <MessageSquare className="h-6 w-6 text-taja-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-taja-primary">Support Records</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
              My <span className="text-taja-primary">Support</span> Tickets
            </h1>
            <p className="text-sm font-medium text-gray-500 max-w-md">
              Track and manage your requests. Our team is working to resolve your issues as quickly as possible.
            </p>
          </motion.div>

          <Link href="/support">
            <Button className="h-16 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 transition-all group">
              <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
           {[
             { label: "Total Tickets", value: pagination.total, icon: Inbox, color: "text-blue-500" },
             { label: "Open Issues", value: tickets.filter(t => t.status === 'open').length, icon: Clock, color: "text-amber-500" },
             { label: "Resolved", value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle, color: "text-emerald-500" },
             { label: "Urgent", value: tickets.filter(t => t.priority === 'urgent').length, icon: TrendingUp, color: "text-rose-500" },
           ].map((stat, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="glass-panel p-6 rounded-3xl border-white hover:border-taja-primary/20 transition-all shadow-sm"
             >
               <div className="flex items-center justify-between mb-3">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
               </div>
               <p className="text-2xl font-black text-gray-900 mb-1">{stat.value}</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
             </motion.div>
           ))}
        </div>

        {/* Filters Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 border-white shadow-xl mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by ticket ID or subject..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-12 pr-4 h-14 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-taja-primary/10 focus:border-taja-primary/30 focus:bg-white transition-all text-gray-900"
              />
            </div>

            <div className="md:col-span-7 flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 px-4 h-14 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-500 focus:outline-none cursor-pointer pr-4"
                  >
                    <option value="">Status</option>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
               </div>

               <div className="flex items-center gap-2 px-4 h-14 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-500 focus:outline-none cursor-pointer pr-4"
                  >
                    <option value="">Category</option>
                    <option value="order">Order Issues</option>
                    <option value="payment">Payment</option>
                    <option value="delivery">Delivery</option>
                    <option value="refund">Refunds</option>
                    <option value="account">Account</option>
                    <option value="technical">Technical</option>
                    <option value="general">General</option>
                  </select>
               </div>

               <div className="flex items-center gap-2 px-4 h-14 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-500 focus:outline-none cursor-pointer pr-4"
                  >
                    <option value="">Priority</option>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
               </div>

               <button 
                 onClick={() => { setFilters({ status: "", category: "", priority: "", search: "" }); setPagination(p => ({ ...p, page: 1 })); fetchTickets(); }}
                 className="ml-auto text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-taja-primary transition-colors h-14 px-4 flex items-center"
               >
                 Clear Filters
               </button>
            </div>
          </div>
        </motion.div>

        {/* Tickets List Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw className="h-12 w-12 animate-spin text-taja-primary mb-6 opacity-40" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">Syncing Protocols...</p>
          </div>
        ) : tickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="glass-panel rounded-[3rem] p-24 text-center border-dashed border-2 border-gray-100"
          >
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100">
               <Inbox className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter">No Active Protocols</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed italic">
              All communications are current. If you need assistance, please initialize a new support request.
            </p>
            <Link href="/support">
              <Button className="rounded-2xl h-14 px-12 font-black uppercase tracking-widest text-[11px] bg-taja-primary text-white hover:shadow-emerald transition-all">
                Open Support Request
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/support/tickets/${ticket._id}`)}
                  className="group relative glass-panel rounded-[2.5rem] overflow-hidden border-white/60 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
                >
                  <div className="p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-5">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-black text-white bg-gray-900 px-4 py-1.5 rounded-full shadow-lg">
                          #{ticket.ticketNumber}
                        </span>
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight group-hover:text-taja-primary transition-colors">
                          {ticket.subject}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-500 font-medium line-clamp-2 max-w-3xl leading-relaxed">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-6">
                         <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                         </div>
                         <div className="flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                                ticket.priority === 'urgent' ? "bg-rose-500" : ticket.priority === 'high' ? "bg-orange-500" : "bg-blue-500"
                             )} />
                             <span className={cn("text-[9px] font-black uppercase tracking-widest", priority.color)}>
                                {priority.label} Priority
                             </span>
                         </div>
                         <div className="h-4 w-px bg-gray-100" />
                         <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeAgo(ticket.createdAt)}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-[9px] font-black text-taja-primary uppercase tracking-widest bg-taja-primary/5 px-3 py-1 rounded-full border border-taja-primary/10">
                            <span>{ticket.category}</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 group/btn">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Protocol Date</p>
                        <p className="text-sm font-black text-gray-900 tracking-tighter italic">{formatDate(ticket.createdAt)}</p>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-taja-primary group-hover:text-white transition-all duration-500 shadow-sm border border-gray-100 group-hover:border-taja-primary">
                        <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-1 group-hover/btn:-rotate-45 transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Accent Bar */}
                  <div className="absolute bottom-0 left-0 h-1 bg-taja-primary w-0 group-hover:w-full transition-all duration-700" />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Improved Pagination */}
        {pagination.pages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-16 px-6"
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
               Showing <span className="text-gray-900">{(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> tickets
            </p>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-white bg-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-all"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Prev
              </Button>
              <div className="flex gap-2">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                    className={cn(
                      "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                      pagination.page === i + 1 
                        ? "bg-taja-primary text-white shadow-emerald" 
                        : "bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-white bg-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-all"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
