import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Stories, guides, and insights from Taja — Nigeria's trusted marketplace for fashion, craft, and independent sellers.",
  openGraph: {
    title: "Journal | Taja.Shop",
    description: "Editorial stories and guides from the Taja marketplace.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <AppHeader />
      {children}
    </div>
  );
}
