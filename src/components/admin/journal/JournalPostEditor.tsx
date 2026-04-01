"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  FileEdit,
  Loader2,
  Save,
  Sparkles,
  ExternalLink,
  Crown,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { JournalRichTextEditor } from "./JournalRichTextEditor";
import { JournalImagePicker } from "./JournalImagePicker";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";

type Category = { _id: string; name: string; slug: string; color?: string };

type Props = {
  /** When set, load post and save with PUT admin API */
  postId?: string;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  category: "",
  tags: "",
  featuredImage: "",
  status: "draft" as "draft" | "published" | "archived",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  relatedProductIds: "",
};

export function JournalPostEditor({ postId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10B981");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api("/api/blog/categories");
      if (res?.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch {
      toast.error("Could not load categories");
    }
  }, []);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await api(`/api/admin/blog/posts/${postId}`);
      if (!res?.success || !res.data) {
        toast.error(res?.message || "Post not found");
        router.push("/admin/journal");
        return;
      }
      const p = res.data as {
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        category: string | { _id: string };
        tags: string[];
        featuredImage?: string;
        status: string;
        isFeatured?: boolean;
        seo?: { title?: string; description?: string };
        relatedProducts?: string[];
      };
      const catId = typeof p.category === "object" ? p.category._id : p.category;
      setForm({
        title: p.title || "",
        slug: p.slug || "",
        excerpt: p.excerpt || "",
        content: p.content || "<p></p>",
        category: String(catId || ""),
        tags: (p.tags || []).join(", "),
        featuredImage: p.featuredImage || "",
        status: (p.status as "draft" | "published" | "archived") || "draft",
        isFeatured: !!p.isFeatured,
        seoTitle: p.seo?.title || "",
        seoDescription: p.seo?.description || "",
        relatedProductIds: Array.isArray(p.relatedProducts)
          ? p.relatedProducts.map((id) => String(id)).join(", ")
          : "",
      });
      setSlugTouched(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load post");
      router.push("/admin/journal");
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Enter a category name");
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await api("/api/blog/categories", {
        method: "POST",
        body: JSON.stringify({ name, color: newCategoryColor }),
      });
      if (!res?.success || !res.data) {
        toast.error(res?.message || "Could not create category");
        return;
      }
      const raw = res.data as { _id: string; name: string; slug: string; color?: string };
      const id = String(raw._id);
      const next: Category = { _id: id, name: raw.name, slug: raw.slug, color: raw.color };
      setCategories((prev) => [...prev, next].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, category: id }));
      setNewCategoryName("");
      toast.success(`Category “${raw.name}” created — you can publish your post now.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create category failed");
    } finally {
      setCreatingCategory(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (postId) loadPost();
  }, [postId, loadPost]);

  const handleTitleBlur = () => {
    if (!slugTouched && form.title.trim()) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  };

  const buildPayload = () => {
    const tags = form.tags
      .split(/[,#]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const relatedProducts = form.relatedProductIds
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean);

    const slug = (form.slug.trim() || slugify(form.title)).trim() || slugify(form.title || "post");

    return {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || undefined,
      content: form.content,
      category: form.category,
      tags,
      featuredImage: form.featuredImage.trim() || undefined,
      status: form.status,
      isFeatured: form.isFeatured,
      seo: {
        title: form.seoTitle.trim() || undefined,
        description: form.seoDescription.trim() || undefined,
      },
      relatedProducts: relatedProducts.length ? relatedProducts : undefined,
    };
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.category) {
      toast.error("Pick a category");
      return;
    }
    if (!form.content || form.content === "<p><br></p>" || form.content === "<p></p>") {
      toast.error("Write something in the body");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      if (postId) {
        const res = await api(`/api/admin/blog/posts/${postId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (res?.success) {
          toast.success("Journal post updated");
          router.push("/admin/journal");
        } else {
          toast.error(res?.message || "Update failed");
        }
      } else {
        const res = await api("/api/blog/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res?.success) {
          toast.success("Journal post created");
          router.push("/admin/journal");
        } else {
          toast.error(res?.message || "Create failed");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32 px-4 sm:px-6 lg:px-8">
      {/* Premium Cinematic Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Link
              href="/admin/journal"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              {postId ? "Edit story" : "New story"}
            </h1>
            <p className="text-emerald-100/40 text-sm font-medium max-w-xl">
              Write blog posts for the Journal. Rich content is saved as HTML and appears on the public Journal exactly as styled in preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {postId && form.slug && (
              <a
                href={`/blog/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-14 px-6 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-emerald-100/80 hover:bg-white/10 transition-all backdrop-blur-md"
              >
                <ExternalLink className="w-4 h-4" />
                View on Journal
              </a>
            )}
            <Button
              onClick={save}
              disabled={saving}
              variant="default"
              className="h-14 rounded-2xl px-10 text-[10px] font-black uppercase tracking-[0.25em] bg-emerald-500 text-white shadow-emerald hover:shadow-emerald-hover border-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Publish / Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Editor Deck */}
        <div className="flex-1 w-full space-y-8 order-2 lg:order-1">
          <div className="glass-panel rounded-[2rem] p-1 border-white/40 mb-8 inline-flex">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                tab === "write" ? "bg-white shadow-xl text-emerald-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <FileEdit className="w-4 h-4" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                tab === "preview" ? "bg-white shadow-xl text-emerald-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "write" ? (
              <motion.div
                key="write"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border-white/60 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 ml-1">Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      onBlur={handleTitleBlur}
                      className="w-full text-3xl md:text-5xl font-black text-slate-900 border-none bg-transparent p-0 focus:ring-0 placeholder:text-slate-200 tracking-tighter leading-tight"
                      placeholder="Headline readers will see everywhere"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 ml-1">Excerpt</label>
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                      rows={2}
                      className="w-full text-lg font-medium text-slate-500 border-none bg-transparent p-0 focus:ring-0 placeholder:text-slate-200 leading-relaxed resize-none"
                      placeholder="Short summary for cards and SEO (max 500 chars)"
                    />
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 ml-1">Article body</label>
                    <JournalRichTextEditor 
                      value={form.content} 
                      onChange={(html) => setForm((f) => ({ ...f, content: html }))} 
                      className="border-none shadow-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Advanced Configuration */}
                <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border-white/60">
                  <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">SEO & advanced</h3>
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO title override</label>
                      <input
                        value={form.seoTitle}
                        onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                        className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold focus:bg-white transition-all"
                        placeholder="Custom meta title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO description</label>
                      <input
                        value={form.seoDescription}
                        onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                        className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold focus:bg-white transition-all"
                        placeholder="Search engine snippet"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Related product IDs (optional, comma-separated MongoDB ids)</label>
                      <input
                        value={form.relatedProductIds}
                        onChange={(e) => setForm((f) => ({ ...f, relatedProductIds: e.target.value }))}
                        className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 font-mono text-xs focus:bg-white transition-all"
                        placeholder="64a…, 64b…"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-[3rem] border border-slate-100 bg-white shadow-huge overflow-hidden"
              >
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black px-12 py-20 text-white relative">
                  <div className="absolute inset-0 bg-motif-blanc opacity-10" />
                  <div className="relative z-10 space-y-6 max-w-4xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-4 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                      Preview
                    </p>
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] italic">
                      {form.title || "Untitled"}
                    </h2>
                    {form.excerpt && (
                      <p className="text-emerald-100/60 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed">
                        {form.excerpt}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-6 md:px-20 py-20 bg-[#FDFDFD]">
                  <BlogArticleBody html={form.content || "<p></p>"} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Operations Sidebar */}
        <div className="w-full lg:w-[360px] space-y-6 lg:sticky lg:top-32 order-1 lg:order-2">
          <div className="glass-card p-8 rounded-[2.5rem] border-white/60 space-y-8">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Publish settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                  className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/10 appearance-none cursor-pointer"
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 font-medium">
                    No categories yet. Add one below — it will appear on the public Journal filters.
                  </p>
                )}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">New category</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Culture, Sellers, News"
                      className="flex-1 min-w-0 h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createCategory();
                        }
                      }}
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-11 w-14 shrink-0 rounded-xl border border-slate-200 cursor-pointer bg-white p-1"
                      title="Badge color on Journal"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl border-emerald-200 text-emerald-800 font-bold text-xs uppercase tracking-widest hover:bg-emerald-50"
                    disabled={creatingCategory}
                    onClick={createCategory}
                  >
                    {creatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create &amp; select
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                  className={cn(
                    "flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest",
                    form.isFeatured 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                  )}
                >
                  <Crown className="w-4 h-4" />
                  Editor&apos;s pick (hero on Journal index)
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/60 space-y-6">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Post details</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL slug</label>
                <div className="relative">
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-white font-mono text-xs font-bold text-slate-900 pr-12"
                    placeholder="auto-from-title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Featured image</label>
                <JournalImagePicker
                  value={form.featuredImage}
                  onChange={(url) => setForm((f) => ({ ...f, featuredImage: url }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-white text-xs font-bold placeholder:font-medium"
                  placeholder="culture, sellers, launch"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
