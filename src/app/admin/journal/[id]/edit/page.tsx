"use client";

import { useParams } from "next/navigation";
import { JournalPostEditor } from "@/components/admin/journal/JournalPostEditor";

export default function AdminJournalEditPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return <p className="p-8 text-slate-500">Invalid post</p>;
  }

  return <JournalPostEditor postId={id} />;
}
