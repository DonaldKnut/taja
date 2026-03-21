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
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Content</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Journal</h1>
          <p className="text-slate-500 text-sm mt-1">Write stories that promote the marketplace — they publish to /blog.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => load()} className="rounded-xl h-11 text-[10px] font-black uppercase tracking-widest">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/journal/new">
            <Button className="rounded-xl h-11 text-[10px] font-black uppercase tracking-widest shadow-premium">
              <Plus className="w-4 h-4 mr-2" />
              New story
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "draft", "published", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors",
              statusFilter === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-slate-600 font-bold mb-2">No posts yet</p>
            <p className="text-sm text-slate-400 mb-6">Create categories if needed (API), then write your first story.</p>
            <Link href="/admin/journal/new">
              <Button className="rounded-xl">New story</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Title</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:table-cell">Updated</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 line-clamp-2">{p.title}</p>
                      {p.isFeatured && (
                        <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Editor&apos;s pick
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                          p.status === "published" && "bg-emerald-50 text-emerald-700",
                          p.status === "draft" && "bg-amber-50 text-amber-800",
                          p.status === "archived" && "bg-slate-100 text-slate-600"
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{p.category?.name || "—"}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs hidden lg:table-cell">
                      {p.updatedAt ? format(new Date(p.updatedAt), "MMM d, yyyy HH:mm") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === "published" && (
                          <a
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="View live"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/journal/${p._id}/edit`}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(p._id, p.title)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
