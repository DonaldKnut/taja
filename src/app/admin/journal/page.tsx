"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  BookOpen,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Filter,
  Search,
  LayoutGrid,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type PostRow = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured?: boolean;
  updatedAt?: string;
  publishedAt?: string;
  category?: { name?: string } | null;
};

export default function AdminJournalPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMobileActions, setShowMobileActions] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`;
      const res = await api(`/api/admin/blog/posts?page=1&limit=100${q}`);
      if (res?.success && res.data?.posts) {
        setPosts(res.data.posts);
      } else {
        setPosts([]);
        if (!res?.success) toast.error(res?.message || "Failed to load posts");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      const res = await api(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
      if (res?.success) {
        toast.success("Deleted");
        load();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const statusOptions = ["all", "draft", "published", "archived"] as const;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-10 selection:bg-emerald-500/30">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-[1.4rem] bg-slate-950 flex items-center justify-center shadow-huge shrink-0 border border-white/10"
          >
            <BookOpen className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Editorial Protocol</span>
              <Sparkles className="h-3 w-3 text-emerald-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic font-sora">Journal Hub</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-md hidden sm:block">Orchestrate stories that drive commerce across the Taja ecosystem.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => load()} 
              className="h-12 px-6 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Sync Fleet
            </Button>
            <Link href="/admin/journal/new">
              <Button className="h-12 px-8 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-huge transition-all active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Story
              </Button>
            </Link>
          </div>

          {/* Mobile Collapse/Dropdown - Premium Approach */}
          <div className="flex sm:hidden items-center gap-2 w-full">
             <Link href="/admin/journal/new" className="flex-1">
                <Button className="w-full h-14 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-huge flex items-center justify-center gap-2">
                   <Plus className="w-4 h-4" />
                   Add New
                </Button>
             </Link>
             <button 
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="h-14 w-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
             >
                <MoreVertical className="h-5 w-5 text-slate-400" />
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Actions Modal/Dropdown */}
      <AnimatePresence>
        {showMobileActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sm:hidden glass-panel p-4 rounded-3xl border-slate-200 shadow-huge bg-white/80 backdrop-blur-xl z-50 fixed bottom-24 left-4 right-4"
          >
            <div className="space-y-2">
              <button 
                onClick={() => { load(); setShowMobileActions(false); }}
                className="w-full h-12 flex items-center gap-4 px-4 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Refresh Data</span>
              </button>
              <div className="h-px bg-slate-100 my-2" />
              <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Context</p>
              <p className="px-4 text-xs font-medium text-slate-500 leading-relaxed">
                Stories publish to /blog and promote the marketplace.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Filter - Horizontal Chip Strip */}
      <div className="relative group">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 hidden lg:group-hover:block transition-opacity">
           <Filter className="h-4 w-4 text-emerald-500/40" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border active:scale-95 shrink-0",
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald"
                  : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-700 shadow-sm"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Premium Content Card */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-600/20" />
                <RefreshCw className="h-6 w-6 absolute inset-0 m-auto animate-spin-slow text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Journal...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-32 px-10">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-10 border-dashed border-2 border-slate-100">
                 <LayoutGrid className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic">Silent Press.</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-10 font-bold">Your journal is empty. Start documenting the future of commerce.</p>
              <Link href="/admin/journal/new">
                <Button className="h-12 px-10 rounded-2xl bg-slate-950 shadow-huge text-[10px] font-black uppercase tracking-widest">Write Story</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Story Title</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Protocol Status</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hidden lg:table-cell">Metadata</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {posts.map((p, idx) => (
                    <motion.tr 
                      key={p._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-10 py-8">
                        <div className="max-w-md">
                          <p className="font-black text-slate-900 text-lg leading-tight tracking-tight mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {p._id.slice(-6)}</span>
                             </div>
                             {p.isFeatured && (
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
                                 <Sparkles className="h-3 w-3" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Featured</span>
                               </div>
                             )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <span
                          className={cn(
                            "inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                            p.status === "published" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                            p.status === "draft" && "bg-amber-50 text-amber-700 border-amber-100",
                            p.status === "archived" && "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-8 hidden lg:table-cell">
                        <div className="space-y-1.5">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category?.name || "Uncategorized"}</div>
                           <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 grayscale opacity-70">
                              <RefreshCw className="w-3 h-3" />
                              {p.updatedAt ? format(new Date(p.updatedAt), "MMM d, HH:mm") : "—"}
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === "published" && (
                            <a
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all active:scale-95"
                              title="View live"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <Link
                            href={`/admin/journal/${p._id}/edit`}
                            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all active:scale-95"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(p._id, p.title)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all active:scale-95"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="hidden sm:block ml-2">
                             <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
