"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[220px] rounded-3xl border border-slate-200 bg-slate-50 animate-pulse" />
  ),
});

export interface ProductDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ProductDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe your product…",
  className,
  disabled,
}: ProductDescriptionEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote"],
        ["clean"],
      ],
    }),
    []
  );

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "list", "bullet", "blockquote"],
    []
  );

  return (
    <div
      className={cn(
        "product-description-editor rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm",
        "[&_.ql-toolbar]:border-slate-200/80 [&_.ql-toolbar]:rounded-t-3xl [&_.ql-toolbar]:bg-slate-50/90",
        "[&_.ql-container]:border-slate-200/80 [&_.ql-container]:rounded-b-3xl [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-taja-secondary",
        "[&_.ql-editor.ql-blank::before]:text-gray-400 [&_.ql-editor.ql-blank::before]:not-italic",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        readOnly={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
