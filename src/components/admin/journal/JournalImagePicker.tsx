"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { uploadJournalImage } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function JournalImagePicker({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image (JPG, PNG, WebP, GIF)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadJournalImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center min-h-[140px] rounded-2xl border-2 border-dashed transition-all",
          value
            ? "border-slate-200 bg-slate-50"
            : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
        )}
        onClick={() => !value && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        ) : value ? (
          <>
            <div className="relative w-full aspect-video max-h-[200px] rounded-xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Featured"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-500">Click to upload or paste URL below</span>
          </>
        )}
      </div>
      {!value && (
        <input
          type="url"
          placeholder="Or paste image URL (https://…)"
          onChange={(e) => onChange(e.target.value.trim())}
          className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      )}
      {value && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="Image URL"
          className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      )}
    </div>
  );
}
