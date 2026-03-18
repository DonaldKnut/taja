"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Paperclip,
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
  Zap,
  ShieldCheck,
  MoreVertical
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
  waiting_customer: { label: "Needs Feedback", color: "bg-rose-50 text-rose-600 border-rose-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState(0);
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
        router.push("/support/tickets");
      }
    } catch (error: any) {
      if (!background) {
        toast.error(error.message || "Failed to load ticket");
        router.push("/support/tickets");
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

  const submitSatisfaction = async () => {
    if (satisfactionRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const res = await supportApi.updateTicket(params.id as string, {
        satisfactionRating,
      });

      if (res.success) {
        toast.success("Thank you for your feedback!");
        await fetchTicket();
      } else {
        toast.error(res.message || "Failed to submit rating");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <RefreshCw className="h-12 w-12 animate-spin text-taja-primary mb-6 opacity-40" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">Syncing Protocols...</p>
      </div>
    );
  }

  if (!ticket) return null;

  const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50/50 selection:bg-taja-primary/30">
      {/* Background Blurs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-taja-primary/5 blur-[150px] rounded-full -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="space-y-4">
            <Link href="/support/tickets" className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-taja-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Records
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
               <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none italic max-w-2xl truncate">
                 {ticket.subject}
               </h1>
               <Badge className={cn("rounded-2xl border px-5 py-2 text-[9px] font-black uppercase tracking-widest shadow-sm w-fit", status.color)}>
                  <StatusIcon className="h-3.5 w-3.5 mr-2" />
                  {status.label}
               </Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <span>Protocol #{ticket.ticketNumber}</span>
               <span className="h-1 w-1 rounded-full bg-gray-300" />
               <span className="text-taja-primary">{ticket.category}</span>
               <span className="h-1 w-1 rounded-full bg-gray-300" />
               <span>Started {formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {refreshing && <RefreshCw className="h-5 w-5 animate-spin text-taja-primary/40" />}
             <button className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <MoreVertical className="h-5 w-5 text-gray-400" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Conversation Module */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[3rem] border-white/60 shadow-huge overflow-hidden glass-panel flex flex-col min-h-[700px]">
              <CardHeader className="px-10 pt-10 pb-6 border-b border-gray-50 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black text-gray-900 tracking-tight uppercase italic mb-1">Secure Interaction</CardTitle>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End-to-End Encrypted Support</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Channel Active
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 sm:px-10 py-10 overflow-y-auto max-h-[800px] scrollbar-hide space-y-12">
                <AnimatePresence initial={false}>
                  {ticket.messages?.map((msg: any, idx: number) => {
                    const isStaff = msg.senderRole === "admin" || msg.senderRole === "seller";
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex gap-5", isStaff ? "flex-row" : "flex-row-reverse")}
                      >
                        <div className="flex-shrink-0">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border relative overflow-hidden",
                             isStaff ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
                           )}>
                              {msg.sender?.avatar ? (
                                <Image src={msg.sender.avatar} alt="Avatar" fill className="object-cover" />
                              ) : (
                                <User className={cn("h-6 w-6", isStaff ? "text-taja-primary" : "text-gray-300")} />
                              )}
                              {isStaff && <Zap className="absolute bottom-1 right-1 h-3 w-3 text-taja-primary fill-taja-primary" />}
                           </div>
                        </div>

                        <div className={cn("max-w-[85%] space-y-2", isStaff ? "items-start" : "items-end text-right")}>
                          <div className={cn(
                            "group p-6 rounded-[2.5rem] shadow-sm border transition-all duration-300",
                            isStaff 
                              ? "bg-gray-900 text-gray-100 border-gray-800 shadow-xl" 
                              : "bg-white border-gray-100 text-gray-900 hover:border-taja-primary/20"
                          )}>
                             <div className="flex items-center gap-2 mb-3">
                               <p className={cn("text-[9px] font-black uppercase tracking-widest", isStaff ? "text-taja-primary" : "text-gray-400")}>
                                 {msg.sender?.fullName || (isStaff ? "Taja Specialist" : "Account Owner")}
                               </p>
                             </div>
                             <div className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap selection:bg-taja-primary/20">
                               {msg.content}
                             </div>
                          </div>
                          <p className="px-6 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Zone */}
              {ticket.status !== "closed" && (
                <div className="p-10 bg-gray-50/80 border-t border-white/60 backdrop-blur-md">
                   <div className="relative glass-panel rounded-3xl overflow-hidden border-white shadow-premium group">
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
                        placeholder="Detail your request here... (Cmd + Enter to Transmit)"
                        rows={4}
                        className="w-full p-6 bg-white/80 border-none focus:ring-0 text-[15px] font-medium text-gray-900 placeholder:text-gray-300 leading-relaxed resize-none transition-all group-focus-within:bg-white"
                      />
                      <div className="absolute bottom-4 right-4 flex items-center gap-4">
                         <div className="hidden sm:flex flex-col items-end opacity-20 group-hover:opacity-100 transition-opacity">
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 italic">Security Level</p>
                            <p className="text-[10px] font-black text-gray-900 tracking-tighter uppercase italic">Military Grade</p>
                         </div>
                         <Button
                           type="button"
                           variant="outline"
                           onClick={() => fileInputRef.current?.click()}
                           disabled={sending}
                           className="h-14 px-5 rounded-2xl"
                         >
                           <Paperclip className="h-4 w-4 mr-2" />
                           Attach
                         </Button>
                         <Button 
                           onClick={sendMessage} 
                           disabled={sending || (!message.trim() && pendingFiles.length === 0)}
                           className="h-14 px-8 rounded-2xl bg-gray-900 border-none hover:bg-black text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-1 transition-all group"
                         >
                            {sending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-3" />
                            ) : (
                              <Send className="h-4 w-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            )}
                            {sending ? "Transmitting..." : "Send Secure"}
                         </Button>
                      </div>
                   </div>
                </div>
              )}
            </Card>

            {/* Satisfaction Module */}
            {ticket.status === "resolved" && !ticket.satisfactionRating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-10 rounded-[3rem] border-emerald-100 bg-emerald-50/10 text-center shadow-emerald/10 shadow-xl"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-emerald">
                   <Star className="h-8 w-8 text-white fill-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">How was the resolution?</h3>
                <p className="text-sm text-gray-500 font-medium mb-8">Your feedback helps us refine our support intelligence.</p>
                <div className="flex items-center justify-center gap-4 mb-10">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSatisfactionRating(star)}
                      className="group transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-12 w-12 transition-all duration-300",
                          star <= satisfactionRating
                            ? "fill-amber-400 text-amber-400 drop-shadow-lg"
                            : "text-gray-200 group-hover:text-amber-200"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={submitSatisfaction} 
                  disabled={satisfactionRating === 0}
                  className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-12 text-[10px] font-black uppercase tracking-widest shadow-emerald shadow-lg"
                >
                  Submit Protocol Grade
                </Button>
              </motion.div>
            )}
          </div>

          {/* Contextual Intelligence Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Status Artifact */}
            <Card className="rounded-[2.5rem] border-white/60 shadow-xl overflow-hidden glass-panel">
               <CardHeader className="px-8 pt-8 pb-4">
                  <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                     <ShieldCheck className="h-4 w-4 text-taja-primary" />
                     Ticket Metadata
                  </CardTitle>
               </CardHeader>
               <CardContent className="px-8 pb-10 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact Level</p>
                        <p className={cn("text-xs font-black uppercase tracking-tighter italic", 
                          ticket.priority === 'urgent' ? 'text-rose-600 underline' : 'text-gray-900'
                        )}>{ticket.priority}</p>
                     </div>
                     <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Record Status</p>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic">{ticket.status}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {ticket.assignedTo && (
                       <div className="flex items-center gap-4 p-5 rounded-2xl border border-taja-primary/10 bg-taja-primary/5">
                          <div className="relative w-12 h-12 rounded-xl bg-white border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                             {ticket.assignedTo.avatar ? (
                               <Image src={ticket.assignedTo.avatar} alt="Staff" fill className="object-cover" />
                             ) : (
                               <User className="h-6 w-6 text-taja-primary m-auto" />
                             )}
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-taja-primary uppercase tracking-widest mb-0.5">Assigned Specialist</p>
                             <p className="text-sm font-black text-gray-900 tracking-tight">{ticket.assignedTo.fullName}</p>
                          </div>
                       </div>
                     )}

                     <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol Start</span>
                        <span className="text-[10px] font-black text-gray-900 italic">{formatDate(ticket.createdAt)}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Related Entity Nexus */}
            {(ticket.relatedOrder || ticket.relatedProduct || ticket.relatedShop) && (
              <Card className="rounded-[2.5rem] border-white/60 shadow-xl overflow-hidden glass-panel backdrop-blur-3xl">
                 <CardHeader className="px-8 pt-8 pb-4">
                    <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                       <Zap className="h-4 w-4 text-taja-primary" />
                       Contextual Nexus
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="px-8 pb-10 space-y-4">
                    {ticket.relatedOrder && (
                      <Link href={`/dashboard/orders/${ticket.relatedOrder._id}`} className="group block">
                         <div className="p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100 group-hover:bg-white group-hover:shadow-premium group-hover:translate-x-1 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-taja-primary border border-gray-100">
                                  <Package className="h-6 w-6" />
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Linked Order</p>
                                  <p className="text-sm font-black text-gray-900">#{ticket.relatedOrder.orderNumber}</p>
                               </div>
                               <ChevronRight className="h-4 w-4 ml-auto text-gray-200 group-hover:text-taja-primary transition-colors" />
                            </div>
                         </div>
                      </Link>
                    )}
                    
                    {ticket.relatedProduct && (
                      <Link href={`/product/${ticket.relatedProduct.slug}`} className="group block">
                         <div className="p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100 group-hover:bg-white group-hover:shadow-premium group-hover:translate-x-1 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center text-gray-300 border border-gray-100">
                                  {ticket.relatedProduct.images?.[0] ? (
                                    <Image src={ticket.relatedProduct.images[0]} alt="Product" fill className="object-cover" />
                                  ) : (
                                    <Package className="h-6 w-6" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Linked Object</p>
                                  <p className="text-sm font-black text-gray-900 truncate">{ticket.relatedProduct.title}</p>
                               </div>
                               <ChevronRight className="h-4 w-4 ml-auto text-gray-200 group-hover:text-taja-primary transition-colors" />
                            </div>
                         </div>
                      </Link>
                    )}
                 </CardContent>
              </Card>
            )}

            {/* Quality Commitment Widget */}
            <div className="p-10 rounded-[2.5rem] bg-gray-900 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10">
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4 italic">Merchant Promise</h4>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed mb-8">
                    Every interaction is part of our commitment to trust and verification. We protect your commerce intelligence.
                  </p>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-white hover:bg-white/5 text-[9px] font-black uppercase tracking-widest">
                    Operational Standards
                  </Button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
