"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  Loader2,
  Users,
  Search,
  CheckSquare,
  Square,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Subscriber {
  _id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AdminBroadcastPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "100",
      });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      const res = await api(`/api/admin/subscribers?${params}`);
      if (res?.success && res?.data) {
        setSubscribers(res.data.subscribers || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (e) {
      toast.error("Failed to load subscribers");
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const toggleOne = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(subscribers.map((s) => s.email)));
    }
  };

  const handleSend = async () => {
    const emails = Array.from(selected);
    if (emails.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Enter a message");
      return;
    }
    setSending(true);
    try {
      const res = await api("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          emails,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      if (res?.success) {
        toast.success(res?.message || "Broadcast sent");
        setSelected(new Set());
        setSubject("");
        setMessage("");
      } else {
        toast.error(res?.message || "Failed to send");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-sm flex items-center justify-center">
            <Megaphone className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Communications</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Broadcast message</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-black">
                <Mail className="h-5 w-5 text-emerald-500" />
                Compose
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Platform updates…"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement or platform update…"
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={sending || selected.size === 0}
                className="w-full rounded-xl h-12 font-bold bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Send to {selected.size} selected
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscribers list */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/30 flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-black">
                <Users className="h-5 w-5 text-emerald-500" />
                Subscribers
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSubscribers()}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-sm w-48"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">All roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
                <Button variant="outline" size="sm" onClick={fetchSubscribers} className="rounded-xl">
                  <Search className="h-4 w-4 mr-1" /> Search
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subscribers found. Users with an email appear here.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <button
                              type="button"
                              onClick={toggleAll}
                              className="p-1 rounded hover:bg-slate-100"
                              aria-label="Select all"
                            >
                              {selected.size === subscribers.length && subscribers.length > 0 ? (
                                <CheckSquare className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <Square className="h-5 w-5 text-slate-400" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscribers.map((s) => (
                          <tr
                            key={s._id}
                            className="hover:bg-slate-50/50 cursor-pointer"
                            onClick={() => toggleOne(s.email)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => toggleOne(s.email)}
                                className="p-1 rounded hover:bg-slate-100"
                              >
                                {selected.has(s.email) ? (
                                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-slate-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900">{s.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{s.fullName || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-100 text-slate-600">
                                {s.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Page {page} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
