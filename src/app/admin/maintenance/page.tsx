"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Loader2,
    CheckCircle2,
    X,
    Database,
    Activity,
    ShieldCheck,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Custom Confirmation Modal for Administrative Actions
 */
function ActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Execute Protocol",
    type = "danger",
    requireVerification = false,
    loading = false
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    type?: "danger" | "warning";
    requireVerification?: boolean;
    loading?: boolean;
}) {
    const [verificationText, setVerificationText] = useState("");
    const isVerified = !requireVerification || verificationText.toUpperCase() === "PURGE";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-taja-secondary/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-huge overflow-hidden border border-taja-light"
                    >
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                                type === "danger" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                            )}>
                                {type === "danger" ? <ShieldAlert className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-taja-light rounded-xl transition-colors">
                                <X className="h-6 w-6 text-taja-secondary/30" />
                            </button>
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <h3 className="text-3xl font-black text-taja-secondary tracking-tight leading-none italic">{title}</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed italic">{description}</p>

                            {requireVerification && (
                                <div className="pt-4 space-y-3">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none">
                                        Type <span className="underline decoration-rose-300">PURGE</span> to authorize
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Verification Code..."
                                        value={verificationText}
                                        onChange={(e) => setVerificationText(e.target.value)}
                                        className="w-full h-14 bg-taja-light/30 border border-taja-light rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-rose-500/5 transition-all outline-none uppercase"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-taja-light/20 border-t border-taja-light flex gap-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-14 rounded-2xl border-taja-light text-taja-secondary/40 font-black uppercase tracking-widest text-[10px] hover:bg-white"
                            >
                                Abort
                            </Button>
                            <Button
                                onClick={onConfirm}
                                disabled={!isVerified || loading}
                                className={cn(
                                    "flex-[2] h-14 rounded-2xl shadow-lg font-black uppercase tracking-widest text-[10px] transition-all",
                                    type === "danger"
                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                                        : "bg-taja-primary hover:bg-taja-secondary text-white shadow-premium"
                                )}
                            >
                                {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                {confirmText}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function AdminMaintenancePage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeModal, setActiveModal] = useState<"demo" | "full" | null>(null);

    const handleCleanup = async (force: boolean = false) => {
        setLoading(true);
        try {
            const res = await api(`/api/admin/cleanup${force ? '?force=all' : ''}`, {
                method: "DELETE"
            });
            setResult(res.data);
            setActiveModal(null);
            toast.success(res.message || "Protocol executed successfully");
        } catch (error: any) {
            toast.error(error.message || "System synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-taja-light/40 p-8 sm:p-12 lg:p-16 space-y-16 selection:bg-taja-primary/30">
            {/* Header Section */}
            <div className="relative">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-20 w-20 rounded-[1.8rem] bg-taja-secondary flex items-center justify-center shadow-huge text-taja-primary border border-taja-secondary p-0.5 group">
                        <div className="w-full h-full rounded-[1.5rem] bg-taja-secondary flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-500">
                            <Database className="h-8 w-8" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-taja-primary mb-2">System Tools</p>
                        <h1 className="text-5xl md:text-6xl font-black text-taja-secondary tracking-tighter italic leading-none">System <span className="text-taja-primary font-thin not-italic">&</span> Maintenance</h1>
                    </div>
                </div>
                <div className="max-w-2xl">
                    <p className="text-lg text-taja-secondary/60 font-medium leading-relaxed italic border-l-4 border-taja-primary/20 pl-6">
                        Authorized platform tools. Clean up database to maintain platform stability and facilitate authentic commerce.
                    </p>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="rounded-[3rem] border-taja-light bg-white shadow-premium hover:shadow-premium-hover transition-all duration-700 group overflow-hidden border">
                    <CardContent className="p-10 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-taja-primary/10 flex items-center justify-center text-taja-primary border border-taja-primary/20 group-hover:scale-110 transition-transform">
                                <Trash2 className="h-7 w-7" />
                            </div>
                            <span className="text-[9px] font-black bg-taja-light text-taja-primary px-4 py-2 rounded-full border border-taja-primary/10 uppercase tracking-widest shadow-sm">Targeted Scrub</span>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-taja-secondary tracking-tight group-hover:text-taja-primary transition-colors italic">Remove Demo Data</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Removes all seeded entities from the Registry catalog. Targeted at "Vintage Finds", "Handmade by Chioma", and "Retro" demo signatures.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={() => setActiveModal("demo")}
                                className="w-full h-18 bg-taja-secondary hover:bg-taja-primary text-white rounded-[1.5rem] shadow-huge font-black uppercase tracking-widest text-[11px] transition-all group-active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                            >
                                Start Cleanup
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[3rem] border-taja-secondary/10 bg-taja-secondary/5 shadow-premium transition-all duration-700 group overflow-hidden border relative">
                    <div className="absolute inset-0 bg-gradient-taja opacity-0 group-hover:opacity-10 transition-opacity" />
                    <CardContent className="p-10 space-y-8 relative">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-taja-secondary flex items-center justify-center text-rose-500 shadow-xl border border-white/5 group-hover:rotate-12 transition-transform">
                                <ShieldAlert className="h-7 w-7" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-taja-primary animate-pulse" />
                                <span className="text-[9px] font-black bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg uppercase tracking-widest">Danger Zone</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-taja-secondary tracking-tight italic">Factory Reset</h3>
                            <p className="text-sm font-medium text-taja-secondary/60 leading-relaxed italic">
                                Absolute cleanup protocol. Erases <span className="font-black text-taja-secondary font-not-italic underline decoration-taja-primary underline-offset-4">EVERY</span> registered product and shop across the entire infrastructure.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={() => setActiveModal("full")}
                                variant="outline"
                                className="w-full h-18 border-taja-secondary/20 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 border-dashed"
                            >
                                Factory Reset
                                <Activity className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <Card className="rounded-[3rem] border-taja-primary/20 bg-white shadow-huge overflow-hidden border p-1 border-emerald-100">
                            <div className="w-full h-full rounded-[2.8rem] bg-gradient-to-br from-white to-taja-light/30 p-12">
                                <div className="flex flex-col md:flex-row items-center gap-12">
                                    <div className="w-24 h-24 rounded-[2.2rem] bg-gradient-taja flex items-center justify-center text-white shadow-2xl shadow-taja-primary/40 border-4 border-white shrink-0 animate-bounce">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-8 flex-1 text-center md:text-left">
                                        <div>
                                            <p className="text-[10px] font-black text-taja-primary uppercase tracking-[0.5em] mb-2">Operation Summary</p>
                                            <h3 className="text-4xl font-black text-taja-secondary tracking-tighter italic w-full border-b border-taja-light pb-6 mb-2">Cleanup Complete</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                                            {[
                                                { label: "Products Removed", value: result.productsDeleted, icon: ShoppingCart },
                                                { label: "Shops Removed", icon: Store },
                                                { label: "Users Removed", icon: Users },
                                            ].map((stat, i) => (
                                                <div key={i} className="space-y-2 group">
                                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                                        <stat.icon className="w-3.5 h-3.5 text-taja-primary group-hover:scale-110 transition-transform" />
                                                        <p className="text-[9px] font-black text-taja-secondary uppercase tracking-widest opacity-40">{stat.label}</p>
                                                    </div>
                                                    <p className="text-6xl font-black text-taja-secondary tracking-tighter group-hover:text-taja-primary transition-colors leading-none">
                                                        {stat.value !== undefined ? `-${stat.value}` : "-0"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <ActionModal
                isOpen={activeModal === "demo"}
                onClose={() => setActiveModal(null)}
                onConfirm={() => handleCleanup(false)}
                loading={loading}
                title="Authorization Required"
                description="This will clean up all pre-seeded demo entities from the platform. Real user data will remain intact. Proceed?"
                confirmText="Clean up Demo Data"
                type="warning"
            />

            <ActionModal
                isOpen={activeModal === "full"}
                onClose={() => setActiveModal(null)}
                onConfirm={() => handleCleanup(true)}
                loading={loading}
                title="System Reset"
                description="CRITICAL: You are about to initiate a full platform reset. All products and shops will be removed. This action is terminal and irreversible."
                confirmText="Start Reset"
                type="danger"
                requireVerification={true}
            />
        </div>
    );
}

// Custom icons using the taja-primary stroke width and colors
import { ShoppingCart, Store, Users } from "lucide-react";
