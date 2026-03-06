"use client";

import { useEffect, useState, Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { FloatingCart } from "@/components/ui/FloatingCart";
import { AuthEntryModal } from "@/components/auth/AuthEntryModal";
import { trackPageView } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { IntegratedMarketplace } from "@/components/marketplace/IntegratedMarketplace";

function MarketplaceContent() {
  const { isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    trackPageView("marketplace_page", { isAuthenticated });
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <AppHeader />
      <main>
        <IntegratedMarketplace />
      </main>
      <AuthEntryModal
        open={authModalOpen && !isAuthenticated}
        onClose={() => setAuthModalOpen(false)}
        source="marketplace"
      />
      <FloatingCart />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-taja-primary"></div></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
