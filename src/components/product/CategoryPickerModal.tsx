"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, Plus, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export type CategoryPickerItem = {
  _id: string;
  name: string;
  slug?: string;
  parent?: null | string | { _id?: string; name?: string; slug?: string };
};

export function categoryPickerLabel(cat: CategoryPickerItem): string {
  const p = cat.parent;
  const parentName =
    p && typeof p === "object" && p && "name" in p && (p as { name?: string }).name
      ? (p as { name: string }).name
      : null;
  return parentName ? `${parentName} › ${cat.name}` : cat.name;
}

type CategoryPickerModalProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryPickerItem[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
  /** POST JSON `{ name, description? }` — e.g. `/api/seller/categories` or `/api/categories` */
  createEndpoint: string;
  onCategoryCreated?: (category: CategoryPickerItem) => void;
  title?: string;
};

export function CategoryPickerModal({
  open,
  onClose,
  categories,
  selectedId,
  onSelect,
  createEndpoint,
  onCategoryCreated,
  title = "Choose category",
}: CategoryPickerModalProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setShowCreate(false);
    setNewName("");
    setNewDescription("");
    const t = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /** Keep create fields on-screen and focusable (keyboard + small viewports) */
  useEffect(() => {
    if (!open || !showCreate) return;
    const id = requestAnimationFrame(() => {
      createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      newNameInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open, showCreate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...categories].sort((a, b) =>
      categoryPickerLabel(a).localeCompare(categoryPickerLabel(b), undefined, { sensitivity: "base" })
    );
    if (!q) return sorted;
    return sorted.filter((c) => {
      const label = categoryPickerLabel(c).toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return label.includes(q) || slug.includes(q);
    });
  }, [categories, search]);

  const handlePick = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter a category name");
      return;
    }
    setCreating(true);
    try {
      const res = (await api(createEndpoint, {
        method: "POST",
        body: JSON.stringify({
          name,
          description: newDescription.trim() || undefined,
        }),
      })) as { success?: boolean; data?: CategoryPickerItem; message?: string };

      if (!res?.success || !res.data?._id) {
        toast.error(res?.message || "Could not create category");
        return;
      }

      const created: CategoryPickerItem = {
        _id: String(res.data._id),
        name: res.data.name,
        slug: res.data.slug,
        parent: res.data.parent ?? null,
      };
      onCategoryCreated?.(created);
      toast.success("Category added");
      onSelect(created._id);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create category";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  if (!mounted) return null;

  const panel = (
    <AnimatePresence>
      {open && (
        <div key="category-picker-root" className="fixed inset-0 z-[10060] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="category-picker-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-picker-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={cn(
              "relative z-10 flex w-full max-h-[min(85dvh,640px)] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-2xl",
              "sm:max-w-md sm:rounded-[24px]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 id="category-picker-title" className="text-lg font-black tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Search existing categories or add a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-50 px-5 py-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-taja-primary/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/15"
                />
              </div>
            </div>

            {/* Single scroll region: list + “add new” so expanded fields stay reachable on mobile */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm font-medium text-slate-500">
                  No categories match &ldquo;{search.trim()}&rdquo;. Try another term or add a new category below.
                </p>
              ) : (
                <ul className="space-y-1 pb-2">
                  {filtered.map((cat) => {
                    const active = String(selectedId) === String(cat._id);
                    return (
                      <li key={cat._id}>
                        <button
                          type="button"
                          onClick={() => handlePick(String(cat._id))}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all",
                            active
                              ? "bg-taja-primary/10 ring-1 ring-taja-primary/25"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <span className="text-sm font-bold text-slate-800">{categoryPickerLabel(cat)}</span>
                          {active && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">
                              Current
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div
                ref={createSectionRef}
                className="mt-4 border-t border-slate-100 bg-slate-50/80 px-2 py-4 sm:px-3 -mx-1 sm:-mx-2 rounded-b-2xl"
              >
                <button
                  type="button"
                  onClick={() => setShowCreate((s) => !s)}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-taja-primary/40 hover:bg-taja-primary/[0.03]"
                >
                  <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <Plus className="h-4 w-4 text-taja-primary" />
                    Add new category
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-slate-400 transition-transform shrink-0", showCreate && "rotate-180")}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {showCreate && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Name *
                        </label>
                        <input
                          ref={newNameInputRef}
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Organic skincare"
                          autoComplete="off"
                          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-taja-primary/50 focus:ring-2 focus:ring-taja-primary/15"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Description (optional)
                        </label>
                        <textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          rows={2}
                          placeholder="Short note for your team or shoppers…"
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-taja-primary/50 focus:ring-2 focus:ring-taja-primary/15"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={creating || !newName.trim()}
                        onClick={handleCreate}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-taja-primary text-sm font-black uppercase tracking-widest text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {creating ? "Creating…" : "Create & use"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
