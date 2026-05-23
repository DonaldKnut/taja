"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, ImageIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api, uploadProductImage } from "@/lib/api";
import type { ProductImageAiAnalysis } from "@/lib/ai/imageRecognition";
import toast from "react-hot-toast";

export type ProductAiFillModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful analysis when the user confirms. */
  onApplied: (payload: {
    analysis: ProductImageAiAnalysis;
    imageUrl: string;
    overwrite: boolean;
    prependImage: boolean;
  }) => void;
};

export function ProductAiFillModal({ open, onClose, onApplied }: ProductAiFillModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductImageAiAnalysis | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [prependImage, setPrependImage] = useState(true);

  useEffect(() => {
    if (!open) {
      setUploading(false);
      setAnalyzing(false);
      setImageUrl(null);
      setAnalysis(null);
      setOverwrite(true);
      setPrependImage(true);
    }
  }, [open]);

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      setUploading(true);
      setAnalysis(null);
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success("Image uploaded — run AI to fill the form.");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const runAnalyze = async () => {
    if (!imageUrl) {
      toast.error("Upload an image first");
      return;
    }
    try {
      setAnalyzing(true);
      const res = await api("/api/ai/analyze-image", {
        method: "POST",
        body: JSON.stringify({ imageUrl }),
      });
      if (!res?.success || !res.analysis) {
        toast.error(res?.message || "AI could not read this image");
        return;
      }
      setAnalysis(res.analysis as ProductImageAiAnalysis);
      toast.success("AI draft ready — review below, then apply.");
    } catch (err: any) {
      toast.error(err?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const apply = () => {
    if (!analysis || !imageUrl) return;
    onApplied({ analysis, imageUrl, overwrite, prependImage });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-fill-title"
            className={cn(
              "fixed left-1/2 top-1/2 z-[20001] w-[min(100%-1.5rem,480px)] max-h-[min(90vh,640px)] -translate-x-1/2 -translate-y-1/2",
              "rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 flex flex-col overflow-hidden"
            )}
            initial={{ opacity: 0, scale: 0.96, y: "-48%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-48%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <p
                  id="ai-fill-title"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400"
                >
                  AI listing assistant
                </p>
                <h2 className="text-lg font-black text-taja-secondary dark:text-slate-100 tracking-tight">
                  Fill from photo
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[11px] text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 leading-relaxed flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  AI can misread photos or invent details. Always review title, price, and category before
                  publishing. If results look wrong, try another angle or lighting.
                </span>
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={pickFile}
                  disabled={uploading}
                  className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Upload image
                </Button>
                <Button
                  type="button"
                  onClick={() => void runAnalyze()}
                  disabled={!imageUrl || analyzing}
                  className="rounded-xl text-[10px] font-black uppercase tracking-widest bg-taja-secondary text-white"
                >
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Run AI
                </Button>
              </div>

              {imageUrl && (
                <p className="text-[10px] font-mono text-slate-500 truncate dark:text-slate-400">{imageUrl}</p>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Overwrite fields that already have text
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prependImage}
                  onChange={(e) => setPrependImage(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Add this image to the product gallery (first slot)
              </label>

              {analysis && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2 text-sm dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Preview · confidence {analysis.confidence ?? "—"}%
                  </p>
                  <p className="font-bold text-taja-secondary dark:text-slate-100">{analysis.seoTitle}</p>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-4 text-xs leading-relaxed">
                    {analysis.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Category hint: {analysis.category}
                    {analysis.subcategory ? ` · ${analysis.subcategory}` : ""}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Price hint:{" "}
                    {analysis.suggestedPriceRange ||
                      (analysis.suggestedPriceNgn ? `₦${analysis.suggestedPriceNgn.toLocaleString()}` : "—")}
                  </p>
                  {analysis.tags?.length ? (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tags: {analysis.tags.slice(0, 8).join(", ")}
                      {analysis.tags.length > 8 ? "…" : ""}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-2 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!analysis}
                onClick={apply}
                className="rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Apply to form
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
