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
} from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supportApi } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_customer: { label: "Waiting Customer", color: "bg-orange-50 text-orange-600 border-orange-100", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-500 border-gray-100", icon: XCircle },
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
    if (!message.trim()) return toast.error("Please enter a message");
    if (ticket?.status === "closed") return toast.error("Ticket is closed");

    try {
      setSending(true);
      const res = await supportApi.addMessage(ticketId!, {
        content: message.trim(),
        isInternal,
      });
      if (!res.success) throw new Error(res.message || "Failed to send");
      setMessage("");
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

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              #{ticket.ticketNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate max-w-[72ch]">
              {ticket.subject}
            </h1>
          </div>
          <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
            <span>Created {timeAgo(ticket.createdAt)}</span>
            {ticket.user?.fullName && (
              <>
                <span>•</span>
                <span className="font-semibold text-slate-700">{ticket.user.fullName}</span>
                {ticket.user.email && <span className="text-slate-400">({ticket.user.email})</span>}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ticket.status}
            disabled={updating}
            onChange={(e) => updateTicket({ status: e.target.value })}
            className="h-11 px-3 rounded-xl border border-gray-100 bg-white text-sm font-semibold"
          >
            {Object.entries(statusConfig).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select
            value={ticket.priority}
            disabled={updating}
            onChange={(e) => updateTicket({ priority: e.target.value })}
            className="h-11 px-3 rounded-xl border border-gray-100 bg-white text-sm font-semibold"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <Button
            variant="outline"
            disabled={updating}
            onClick={() => updateTicket({ assignedTo: "me" })}
          >
            Assign to me
          </Button>
          <Button
            variant="outline"
            disabled={updating}
            onClick={() => updateTicket({ assignedTo: "" })}
          >
            Unassign
          </Button>

          <select
            value={assigneeId}
            disabled={updating}
            onChange={(e) => {
              const v = e.target.value;
              setAssigneeId(v);
              updateTicket({ assignedTo: v });
            }}
            className="h-11 px-3 rounded-xl border border-gray-100 bg-white text-sm font-semibold"
            title="Assign to specific admin"
          >
            <option value="">Assign to…</option>
            {admins.map((a) => (
              <option key={a._id} value={a._id}>
                {a.fullName} ({a.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-100">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[680px] overflow-y-auto pb-4">
                {ticket.messages?.length ? (
                  ticket.messages.map((msg: any, idx: number) => {
                    const isStaff = msg.senderRole === "admin" || msg.senderRole === "seller" || msg.senderRole === "system";
                    const bubble = isStaff ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900 border border-gray-100";
                    return (
                      <div key={idx} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                        <div className="flex-shrink-0">
                          {msg.sender?.avatar ? (
                            <Image
                              src={msg.sender.avatar}
                              alt={msg.sender.fullName || "User"}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-emerald-600" />
                            </div>
                          )}
                        </div>
                        <div className={cn("flex-1", isStaff ? "text-right" : "")}>
                          <div className={cn("inline-block p-3 rounded-2xl max-w-[90%]", bubble)}>
                            <div className="text-sm font-black mb-1 flex items-center gap-2 justify-between">
                              <span>
                                {msg.senderRole === "system"
                                  ? "Taja Support Bot"
                                  : msg.sender?.fullName || (isStaff ? "Support" : "User")}
                                {msg.isInternal && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
                                    <ShieldAlert className="h-3 w-3" />
                                    Internal
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                          </div>
                          <div className={cn("text-xs text-slate-400 mt-1", isStaff ? "text-right" : "")}>
                            {timeAgo(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-center py-8">No messages yet</p>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {ticket.status !== "closed" && (
            <Card className="bg-white border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Internal note (staff-only)
                  </label>
                  {ticket.assignedTo?.fullName ? (
                    <div className="text-sm text-emerald-700 font-semibold">
                      Assigned: {ticket.assignedTo.fullName}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">Unassigned</div>
                  )}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) sendMessage();
                  }}
                  placeholder="Reply… (Cmd/Ctrl + Enter to send)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-100 rounded-2xl mb-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                />
                <div className="flex justify-end">
                  <Button onClick={sendMessage} disabled={sending || !message.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-white border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-500">Category</div>
                <div className="text-sm font-black text-slate-900 capitalize">{ticket.category}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Priority</div>
                <div className="text-sm font-black text-slate-900 capitalize">{ticket.priority}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">First Response</div>
                <div className="text-sm font-black text-slate-900">
                  {ticket.firstResponseAt ? timeAgo(ticket.firstResponseAt) : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

