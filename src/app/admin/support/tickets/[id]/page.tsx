"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  ShieldAlert,
  User,
  XCircle,
  Paperclip,
  Loader2,
  FileIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supportApi, uploadSupportAttachment } from "@/lib/api";
import { cn, timeAgo, formatDate } from "@/lib/utils";

const statusConfig = {
  open: { label: "Open", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Clock },
  waiting_customer: { label: "User Pending", color: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-100/50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketId = params.id as string | undefined;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [admins, setAdmins] = useState<Array<{ _id: string; fullName: string; email: string }>>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await supportApi.getTicket(ticketId!);
      if (res.success) setTicket(res.data);
      else throw new Error(res.message || "Ticket not found");
    } catch (e: any) {
      toast.error(e.message || "Failed to load ticket");
      router.push("/admin/support/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const loadAdmins = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        const res = await fetch(`/api/admin/users?role=admin&limit=200&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json?.success) {
          const list = (json.data?.users || []).map((u: any) => ({
            _id: String(u._id),
            fullName: u.fullName,
            email: u.email,
          }));
          setAdmins(list);
        }
      } catch {
        // ignore
      }
    };
    loadAdmins();
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    // Mark as seen (fire-and-forget)
    supportApi.markSeen(ticketId).catch(() => {});
  }, [ticketId]);

  useEffect(() => {
    if (!ticket) return;
    setAssigneeId(ticket.assignedTo?._id ? String(ticket.assignedTo._id) : "");
  }, [ticket?.assignedTo?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  useEffect(() => {
    if (!ticketId) return;
    if (!ticket) return;
    if (ticket.status === "closed") return;
    const interval = setInterval(fetchTicket, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, ticket?.status]);

  const sendMessage = async () => {
    if (!message.trim() && !attachmentFile) return toast.error("Please enter a message or select a file");
    if (ticket?.status === "closed") return toast.error("Ticket is closed");

    try {
      setSending(true);
      let attachments: any[] = [];
      if (attachmentFile) {
        setIsUploading(true);
        const uploaded = await uploadSupportAttachment(attachmentFile);
        attachments = [uploaded];
        setIsUploading(false);
      }

      const res = await supportApi.addMessage(ticketId!, {
        content: message.trim(),
        isInternal,
        attachments,
      });
      if (!res.success) throw new Error(res.message || "Failed to send");
      setMessage("");
      setAttachmentFile(null);
      setIsInternal(false);
      await fetchTicket();
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const updateTicket = async (patch: any) => {
    try {
      setUpdating(true);
      const res = await supportApi.updateTicket(ticketId!, patch);
      if (!res.success) throw new Error(res.message || "Update failed");
      await fetchTicket();
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-emerald-500/15 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) return null;

  const status = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/support/tickets" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Inbox
        </Link>
        <Badge className={status.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              #{ticket.ticketNumber}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight truncate max-w-[72ch]">
              {ticket.subject}
            </h1>
          </div>
          <div className="text-sm text-slate-500 flex flex-wrap items-center gap-3 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Created {timeAgo(ticket.createdAt)}
            </span>
            {ticket.user?.fullName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <User className="h-4 w-4" />
                  {ticket.user.fullName}
                  {ticket.user.email && <span className="font-normal text-slate-400">({ticket.user.email})</span>}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/60 backdrop-blur border border-slate-100 rounded-2xl p-1.5 gap-2">
            <select
              value={ticket.status}
              disabled={updating}
              onChange={(e) => updateTicket({ status: e.target.value })}
              className="h-10 px-3 rounded-xl border-none bg-transparent text-sm font-bold focus:ring-0 outline-none cursor-pointer"
            >
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>

            <div className="w-px h-6 bg-slate-100" />

            <select
              value={ticket.priority}
              disabled={updating}
              onChange={(e) => updateTicket({ priority: e.target.value })}
              className="h-10 px-3 rounded-xl border-none bg-transparent text-sm font-bold focus:ring-0 outline-none cursor-pointer"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 hover:shadow-sm"
              disabled={updating}
              onClick={() => updateTicket({ assignedTo: "me" })}
            >
              Claim
            </Button>
            
            <select
              value={assigneeId}
              disabled={updating}
              onChange={(e) => {
                const v = e.target.value;
                setAssigneeId(v);
                updateTicket({ assignedTo: v });
              }}
              className="h-12 px-4 rounded-2xl border border-slate-100 bg-white/60 backdrop-blur text-sm font-black focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              title="Assign to specific admin"
            >
              <option value="">Staff Assignee…</option>
              {admins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-[2rem] overflow-hidden flex flex-col h-[740px]">
            <div className="p-6 border-b border-slate-100 bg-white/40">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Conversation</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {ticket.messages?.length ? (
                ticket.messages.map((msg: any, idx: number) => {
                  const isStaff = msg.senderRole === "admin" || msg.senderRole === "seller" || msg.senderRole === "system";
                  const isSystem = msg.senderRole === "system";
                  return (
                    <div key={idx} className={cn("flex flex-col", isStaff ? "items-end" : "items-start")}>
                      <div className={cn(
                        "flex gap-3 max-w-[85%] mb-1",
                        isStaff ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className="flex-shrink-0 mt-auto">
                          {msg.sender?.avatar ? (
                            <Image
                              src={msg.sender.avatar}
                              alt={msg.sender.fullName || "User"}
                              width={32}
                              height={32}
                              className="rounded-full ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm",
                              isStaff ? "bg-slate-900 text-white" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {isSystem ? "🤖" : <User className="h-4 w-4" />}
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "p-4 rounded-3xl text-sm font-medium shadow-sm",
                          isStaff 
                            ? isSystem ? "bg-indigo-50 text-indigo-900 rounded-tr-none border border-indigo-100" : "bg-slate-900 text-white rounded-tr-none" 
                            : "bg-white text-slate-900 rounded-tl-none border border-slate-100"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2 mb-1 text-[11px] font-black uppercase tracking-wider",
                            isStaff ? isSystem ? "text-indigo-600" : "text-slate-400" : "text-emerald-600"
                          )}>
                            <span>
                              {isSystem ? "Support Bot" : msg.sender?.fullName || (isStaff ? "Staff" : "User")}
                            </span>
                            {msg.isInternal && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200 ml-2">
                                <ShieldAlert className="h-3 w-3" />
                                Staff Only
                              </span>
                            )}
                          </div>
                          
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 grid gap-2">
                              {msg.attachments.map((att: any, attIdx: number) => (
                                <a
                                  key={attIdx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-2xl border transition-all",
                                    isStaff ? "bg-white/10 border-white/10 hover:bg-white/20" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                                  )}
                                >
                                  <div className={cn(
                                    "p-2 rounded-xl",
                                    isStaff ? "bg-slate-800 text-white" : "bg-white text-emerald-600 shadow-sm"
                                  )}>
                                    <FileIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0 pr-4">
                                    <div className="truncate text-[11px] font-black">{att.filename || "Attachment"}</div>
                                    <div className="text-[10px] opacity-60 font-medium">View File</div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 px-11 uppercase tracking-widest">
                        {timeAgo(msg.createdAt)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">No messages yet</h3>
                  <p className="text-sm text-slate-500 max-w-[200px]">The conversation has not started.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {ticket.status !== "closed" && (
              <div className="p-6 border-t border-slate-100 bg-white/40">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative h-5 w-5 rounded-lg border-2 border-slate-200 group-hover:border-amber-400 transition-colors flex items-center justify-center bg-white overflow-hidden">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {isInternal && <CheckCircle className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <span className="text-sm font-black text-slate-600 tracking-tight">Internal Note <span className="text-[10px] uppercase text-slate-400 font-bold ml-1 tracking-widest">(User won't see this)</span></span>
                  </label>
                  
                  {ticket.assignedTo?.fullName ? (
                    <div className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                      You are responding
                    </div>
                  ) : (
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 rounded-lg border border-slate-100">
                      Unassigned
                    </div>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) sendMessage();
                    }}
                    placeholder={isInternal ? "Type internal staff note..." : "Type your reply to user..."}
                    rows={4}
                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-3xl pb-16 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all outline-none text-sm font-medium leading-relaxed resize-none shadow-sm"
                  />
                  
                  <div className="absolute left-4 bottom-4 flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-10 px-4 rounded-xl font-bold text-xs gap-2 transition-all border",
                        attachmentFile ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "text-slate-500 border-transparent hover:bg-slate-50 hover:border-slate-100"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachmentFile ? attachmentFile.name.slice(0, 15) + "..." : "Attach File"}
                      {attachmentFile && (
                        <div 
                          className="p-1 hover:bg-emerald-100 rounded-md ml-1" 
                          onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); }}
                        >
                          <XCircle className="h-3 w-3" />
                        </div>
                      )}
                    </Button>
                  </div>

                  <div className="absolute right-4 bottom-4">
                    <Button 
                      className="h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                      onClick={sendMessage} 
                      disabled={sending || (!message.trim() && !attachmentFile)}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white/40">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Request Info</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</div>
                  <Badge className={cn("rounded-lg font-bold border", status.color)}>
                    {status.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</div>
                  <div className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-black uppercase tracking-widest",
                    ticket.priority === 'urgent' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                    ticket.priority === 'high' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                    'text-slate-600 bg-slate-50 border-slate-100'
                  )}>
                    {ticket.priority || 'Medium'}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</span>
                  <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg capitalize border border-slate-100">{ticket.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Received</span>
                  <span className="text-xs font-black text-slate-900">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Response Time</span>
                  <span className="text-xs font-black text-emerald-600">
                    {ticket.firstResponseAt ? timeAgo(ticket.firstResponseAt) : "Awaiting response"}
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              <div className="space-y-4">
                <div className="text-xs font-black text-slate-900 mb-2">Linked Business/Account</div>
                {ticket.user ? (
                   <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{ticket.user.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-widest">{ticket.user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No user linked</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

