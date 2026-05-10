"use client";

import { Suspense } from "react";
import { IntegratedMarketplace } from "@/components/marketplace/IntegratedMarketplace";

function DashboardMarketplaceInner() {
  return <IntegratedMarketplace isInsideDashboard={true} />;
}

export default function DashboardMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center bg-[#F8F9FB]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-taja-primary" />
        </div>
      }
    >
      <DashboardMarketplaceInner />
    </Suspense>
  );
}
