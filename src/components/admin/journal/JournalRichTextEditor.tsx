"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[420px] rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
      Loading editor…
    </div>
  ),
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

export function JournalRichTextEditor({ value, onChange, className }: Props) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "link"],
        ["clean"],
      ],
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "blockquote",
    "link",
  ];

  return (
    <div
      className={cn(
        "journal-quill rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="journal-quill-inner bg-white"
      />
    </div>
  );
}
