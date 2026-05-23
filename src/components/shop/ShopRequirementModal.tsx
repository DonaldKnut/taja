"use client";

import { useRouter } from "next/navigation";
import { Store, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ShopRequirementModalProps {
    open: boolean;
}

export function ShopRequirementModal({ open }: ShopRequirementModalProps) {
    const router = useRouter();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-white/20 backdrop-blur-md transition-opacity duration-500" />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl shadow-premium rounded-2xl border border-white/50 p-8 flex flex-col gap-8 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 ring-1 ring-taja-primary/5">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="bg-taja-light w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-inner ring-4 ring-white">
                        <Store className="h-10 w-10 text-taja-primary animate-float" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-extrabold text-taja-secondary tracking-tight">Create Your Shop First</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                            To start selling on Taja, you need to set up your shop profile. This helps customers trust your brand.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="glass-panel p-5 rounded-2xl flex items-start gap-4 border-taja-primary/5">
                        <div className="h-10 w-10 rounded-xl bg-taja-primary/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-5 w-5 text-taja-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-taja-secondary">Professional Storefront</h4>
                            <p className="text-[12px] text-gray-500 leading-tight">
                                Get a dedicated link (taja.shop/shop/your-name) to share on social media.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={() => router.push("/seller/setup")}
                        variant="default"
                        size="lg"
                        className="w-full gap-3 font-bold group"
                    >
                        Set Up My Shop
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/seller/dashboard")}
                        className="w-full text-gray-400 hover:text-taja-primary font-medium"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
