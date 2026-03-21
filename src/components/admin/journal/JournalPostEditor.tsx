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
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { JournalRichTextEditor } from "./JournalRichTextEditor";
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
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/journal"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-600 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Journal
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-500" />
            {postId ? "Edit story" : "New story"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rich content is saved as HTML and appears on the public Journal exactly as styled below in preview.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {postId && form.slug && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            >
              <ExternalLink className="w-4 h-4" />
              Live
            </a>
          )}
          <Button
            onClick={save}
            disabled={saving}
            className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-[0.2em] shadow-premium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Publish / save"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === "write" ? "bg-white shadow text-emerald-700" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileEdit className="w-4 h-4" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === "preview" ? "bg-white shadow text-emerald-700" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {tab === "write" ? (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onBlur={handleTitleBlur}
                className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
                placeholder="Headline readers will see everywhere"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL slug *</label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white font-mono text-sm"
                placeholder="auto-from-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold"
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={3}
                maxLength={500}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-sm leading-relaxed"
                placeholder="Short summary for cards and SEO (max 500 chars)"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured image URL</label>
              <input
                value={form.featuredImage}
                onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-sm"
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))
                }
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-8">
              <input
                id="isFeatured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600"
              />
              <label htmlFor="isFeatured" className="text-sm font-bold text-slate-700">
                Editor&apos;s pick (hero on Journal index)
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-sm"
                placeholder="culture, sellers, launch"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Related product IDs (optional, comma-separated MongoDB ids)
              </label>
              <input
                value={form.relatedProductIds}
                onChange={(e) => setForm((f) => ({ ...f, relatedProductIds: e.target.value }))}
                className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white font-mono text-xs"
                placeholder="64a… , 64b…"
              />
            </div>
            <div className="md:col-span-2 grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO title override</label>
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO description</label>
                <input
                  value={form.seoDescription}
                  onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Body *</label>
            <JournalRichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-premium overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 px-8 py-12 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300/80 mb-2">Preview</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight italic leading-tight">
              {form.title || "Untitled story"}
            </h2>
            {form.excerpt && <p className="mt-4 text-emerald-100/90 text-lg max-w-2xl">{form.excerpt}</p>}
          </div>
          <div className="px-6 sm:px-12 py-12 bg-[#FAFBFC]">
            <BlogArticleBody html={form.content || "<p></p>"} />
          </div>
        </div>
      )}
    </div>
  );
}
