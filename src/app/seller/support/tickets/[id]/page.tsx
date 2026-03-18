"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  User, 
  Package, 
  Store, 
  Star,
  ChevronRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supportApi, uploadSupportAttachment } from "@/lib/api";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_customer: { label: "Needs Feedback", color: "bg-orange-50 text-orange-600 border-orange-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
};

export default function SellerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchTicket();
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id || !ticket || ticket.status === "closed") return;
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchTicket({ background: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [params.id, ticket?.status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const fetchTicket = async ({ background = false }: { background?: boolean } = {}) => {
    try {
      if (!background) setLoading(true);
      else setRefreshing(true);
      
      const res = await supportApi.getTicket(params.id as string);
      if (res.success) {
        setTicket(res.data);
      } else {
        toast.error(res.message || "Ticket not found");
        router.push("/seller/support/tickets");
      }
    } catch (error: any) {
      if (!background) {
        toast.error(error.message || "Failed to load ticket");
        router.push("/seller/support/tickets");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && pendingFiles.length === 0) return;
    if (ticket?.status === "closed") {
      toast.error("This ticket is closed.");
      return;
    }

    try {
      setSending(true);
      const attachments =
        pendingFiles.length > 0
          ? await Promise.all(pendingFiles.map((f) => uploadSupportAttachment(f)))
          : [];
      setPendingFiles([]);
      const res = await supportApi.addMessage(params.id as string, {
        content: message.trim() || "Attachment(s)",
        attachments,
      });

      if (res.success) {
        setMessage("");
        await fetchTicket({ background: true });
        toast.success("Message transmitted");
      } else {
        toast.error(res.message || "Failed to transmit message");
      }
    } catch (error: any) {
      toast.error(error.message || "Transmission failed");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-taja-primary mb-4" />
        <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (!ticket) return null;

  const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10">
        
        {/* Top Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/seller/support/tickets">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white shadow-sm border border-gray-100 h-14 w-14">
                <ArrowLeft className="h-6 w-6 text-taja-secondary" />
              </Button>
            </Link>
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <Link href="/seller" className="hover:text-taja-primary">Merchant Hub</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/seller/support/tickets" className="hover:text-taja-primary">Support Record</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-taja-secondary">Ticket Context</span>
              </nav>
              <h1 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter uppercase italic leading-none truncate max-w-xl">
                 {ticket.subject}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Badge className={cn("rounded-2xl border px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm", status.color)}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {status.label}
             </Badge>
             <div className="hidden sm:block h-10 w-px bg-gray-100 mx-2" />
             <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Ticket ID</p>
                <p className="text-xs font-black text-taja-primary">#{ticket.ticketNumber}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Interaction Area */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[3rem] border-white/60 shadow-premium overflow-hidden glass-panel flex flex-col min-h-[600px]">
              <CardHeader className="px-10 pt-10 pb-6 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-taja-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-taja-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-taja-secondary tracking-tight uppercase italic">Conversation</CardTitle>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Merchant Channel</p>
                    </div>
                  </div>
                  {refreshing && <Loader2 className="h-4 w-4 animate-spin text-taja-primary" />}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 px-4 sm:px-10 py-10 overflow-y-auto max-h-[700px] scrollbar-hide space-y-10">
                <AnimatePresence initial={false}>
                  {ticket.messages?.map((msg: any, idx: number) => {
                    const isStaff = msg.senderRole === "admin";
                    const isSelf = msg.senderRole === "seller" || msg.sender?._id === ticket.user?._id;
                    // Note: If the seller is the requester, they are "Self". 
                    // If it's another seller (assigned staff), they might be "Staff".
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex gap-5", isStaff ? "flex-row-reverse" : "flex-row")}
                      >
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm relative overflow-hidden",
                            isStaff ? "bg-taja-secondary border-taja-secondary/20" : "bg-white border-gray-100"
                          )}>
                             {msg.sender?.avatar ? (
                               <Image src={msg.sender.avatar} alt="Sender" fill className="object-cover" />
                             ) : (
                               <User className={cn("h-6 w-6", isStaff ? "text-taja-primary" : "text-gray-300")} />
                             )}
                          </div>
                        </div>

                        <div className={cn("max-w-[80%] space-y-2", isStaff ? "items-end text-right" : "items-start")}>
                          <div className={cn(
                            "p-6 rounded-[2rem] shadow-sm border",
                            isStaff 
                              ? "bg-taja-secondary text-white border-taja-secondary shadow-lg shadow-taja-secondary/10" 
                              : "bg-white border-gray-100 text-taja-secondary"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                               <p className={cn("text-[10px] font-black uppercase tracking-widest", isStaff ? "text-taja-primary" : "text-gray-400")}>
                                 {msg.sender?.fullName || (isStaff ? "Support Intelligence" : "Merchant")}
                               </p>
                               {isStaff && <Zap className="w-3 h-3 text-taja-primary fill-taja-primary" />}
                            </div>
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              {ticket.status !== "closed" && (
                <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) setPendingFiles((prev) => [...prev, ...files].slice(0, 4));
                        e.currentTarget.value = "";
                      }}
                    />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          sendMessage();
                        }
                      }}
                      placeholder="Type your response... (Cmd + Enter to send)"
                      rows={3}
                      className="w-full rounded-2xl p-5 bg-white border border-gray-100 focus:border-taja-primary/40 focus:ring-4 focus:ring-taja-primary/5 transition-all text-sm font-medium text-taja-secondary placeholder:text-gray-300 leading-relaxed resize-none shadow-sm"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
                       <Button
                         type="button"
                         variant="outline"
                         onClick={() => fileInputRef.current?.click()}
                         disabled={sending}
                         className="h-12 rounded-xl"
                       >
                         Attach
                       </Button>
                       <Button 
                         onClick={sendMessage} 
                         disabled={sending || (!message.trim() && pendingFiles.length === 0)}
                         className="h-12 px-8 rounded-xl bg-taja-secondary hover:bg-black text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all"
                       >
                         {sending ? (
                           <Loader2 className="h-4 w-4 animate-spin mr-2" />
                         ) : (
                           <Send className="h-4 w-4 mr-2" />
                         )}
                         {sending ? "Sending..." : "Transmit Response"}
                       </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Ticket Intelligence */}
            <Card className="rounded-[2.5rem] border-white/60 shadow-premium overflow-hidden glass-panel">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-lg font-black text-taja-secondary tracking-tight uppercase italic flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-taja-primary" />
                    Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                        ticket.priority === 'high' || ticket.priority === 'urgent' ? "text-rose-500" : "text-taja-primary"
                      )}>{ticket.priority}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                      <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">{ticket.category}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</span>
                      <span className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">{formatDate(ticket.createdAt)}</span>
                   </div>
                </div>

                {ticket.assignedTo && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-taja-primary/10 bg-taja-primary/5">
                     <div className="w-10 h-10 rounded-xl bg-white border border-taja-primary/20 flex items-center justify-center">
                        {ticket.assignedTo.avatar ? (
                          <Image src={ticket.assignedTo.avatar} alt="Staff" width={40} height={40} className="rounded-xl" />
                        ) : (
                          <User className="w-5 h-5 text-taja-primary" />
                        )}
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-taja-primary uppercase tracking-widest">Assigned Specialist</p>
                        <p className="text-sm font-black text-taja-secondary">{ticket.assignedTo.fullName}</p>
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Entity Context */}
            {(ticket.relatedOrder || ticket.relatedProduct || ticket.relatedShop) && (
              <Card className="rounded-[2.5rem] border-white/60 shadow-premium overflow-hidden glass-panel">
                <CardHeader className="px-8 pt-8 pb-4">
                  <CardTitle className="text-lg font-black text-taja-secondary tracking-tight uppercase italic flex items-center gap-3">
                      <Zap className="w-5 h-5 text-taja-primary" />
                      Related Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-4">
                   {ticket.relatedOrder && (
                     <Link href={`/seller/orders/${ticket.relatedOrder._id}`} className="block group">
                        <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group-hover:bg-white group-hover:shadow-premium transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400">
                                 <Package className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Linked Order</p>
                                 <p className="text-sm font-black text-taja-secondary">#{ticket.relatedOrder.orderNumber}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-taja-primary" />
                           </div>
                        </div>
                     </Link>
                   )}
                   {ticket.relatedProduct && (
                     <Link href={`/seller/products/${ticket.relatedProduct._id}/edit`} className="block group">
                        <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group-hover:bg-white group-hover:shadow-premium transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 overflow-hidden relative">
                                 {ticket.relatedProduct.images?.[0] ? (
                                   <Image src={ticket.relatedProduct.images[0]} alt="Product" fill className="object-cover" />
                                 ) : (
                                   <Package className="w-5 h-5" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Linked Product</p>
                                 <p className="text-sm font-black text-taja-secondary truncate">{ticket.relatedProduct.title}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-taja-primary" />
                           </div>
                        </div>
                     </Link>
                   )}
                </CardContent>
              </Card>
            )}

            {/* Help Widget */}
            <div className="p-8 rounded-[2.5rem] bg-taja-secondary text-white relative overflow-hidden group">
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
               <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">Protocol Status</h4>
               <p className="text-[10px] font-bold text-white/60 leading-relaxed mb-6">
                 This interaction is recorded for merchant safety and quality assurance.
               </p>
               <Link href="/seller/support">
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest">
                   Report Inaccuracy
                 </Button>
               </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
