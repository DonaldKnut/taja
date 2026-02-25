"use client";

import { useState } from "react";
import {
    Settings,
    Shield,
    Bell,
    CreditCard,
    Globe,
    Lock,
    Save,
    RotateCcw,
    AlertCircle,
    Smartphone,
    Mail,
    Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { toast } from "react-hot-toast";

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState("platform");
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Platform settings updated successfully");
        }, 1500);
    };

    const tabs = [
        { id: "platform", label: "Core Identities", icon: Globe },
        { id: "escrow", label: "Capital Logistics", icon: CreditCard },
        { id: "security", label: "Registry Guard", icon: Shield },
        { id: "notifications", label: "Platform Signals", icon: Bell },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="mb-10 p-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
                            <Settings className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Architecture</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Core Configuration</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2">
                            <RotateCcw className="h-4 w-4" /> Reset to Default
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="h-12 px-10 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] shadow-huge hover:bg-emerald-600 transition-all flex items-center gap-3"
                        >
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <><Save className="h-4 w-4" /> Update Platform</>}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <aside className="md:w-72 space-y-3">
                    <div className="p-1.5 bg-slate-100/50 rounded-[2rem] border border-slate-200/50">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${activeTab === tab.id
                                    ? "bg-slate-950 text-white shadow-huge translate-x-1"
                                    : "text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-emerald-400" : "group-hover:text-emerald-600"}`} />
                                    {tab.label}
                                </div>
                                {activeTab === tab.id && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />}
                            </button>
                        ))}
                    </div>
                    <div className="p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 mt-6 overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Shield className="h-24 w-24 text-emerald-600" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-black text-emerald-950">System Protected</p>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === "platform" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-8">
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">Base Parameters</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Core marketplace definition</CardDescription>
                                </CardHeader>
                                <CardContent className="px-10 py-10 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                App Name
                                            </label>
                                            <Input defaultValue="Taja.Shop" className="h-14 rounded-2xl bg-white border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-900" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Support Email
                                            </label>
                                            <Input defaultValue="support@taja.shop" className="h-14 rounded-2xl bg-white border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-900" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-8 bg-rose-50/50 rounded-[2rem] border border-rose-100 transition-all hover:bg-rose-50 group">
                                        <div className="flex gap-6">
                                            <div className="h-14 w-14 bg-white border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                                                <AlertCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-rose-950 uppercase tracking-tight">Preservation Mode</p>
                                                <p className="text-xs font-medium text-rose-700 mt-1 uppercase tracking-widest opacity-60">Restrict all transactions & entry</p>
                                            </div>
                                        </div>
                                        <Switch className="data-[state=checked]:bg-rose-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-6">
                                    <CardTitle className="text-sm font-black text-slate-900 tracking-widest uppercase">Smart Features</CardTitle>
                                </CardHeader>
                                <CardContent className="px-10 py-10">
                                    <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-emerald-200 transition-all group">
                                        <div className="flex gap-6">
                                            <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Neural Catalyst</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Enable AI-assisted intelligence for inventories</p>
                                            </div>
                                        </div>
                                        <Switch checked className="data-[state=checked]:bg-emerald-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "escrow" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-8">
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">Fees & Payments</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage platform commissions and payout limits</CardDescription>
                                </CardHeader>
                                <CardContent className="px-10 py-10 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Service Fee</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Percentage charged on each sale</p>
                                            </div>
                                            <div className="flex items-center gap-3 w-32 bg-white p-2 rounded-xl border border-slate-100 shadow-inner">
                                                <Input defaultValue="5.0" className="bg-transparent border-none text-right font-black text-slate-950 focus:ring-0 p-0 text-lg" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase">%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Minimum Withdrawal</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lowest amount a seller can cash out</p>
                                            </div>
                                            <div className="flex items-center gap-3 w-40 bg-white p-2 rounded-xl border border-slate-100 shadow-inner">
                                                <span className="text-[10px] font-black text-slate-300 uppercase ml-2">NGN</span>
                                                <Input defaultValue="100.00" className="bg-transparent border-none text-right font-black text-slate-950 focus:ring-0 p-0 text-lg pr-2" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-6">
                                    <CardTitle className="text-base font-black text-slate-900 tracking-widest uppercase">Alert Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-6 space-y-2">
                                    {[
                                        { label: "New Registrations", desc: "Get notified when a new shop joins", icon: Mail },
                                        { label: "High Value Sales", desc: "Alerts for orders above ₦500k", icon: Smartphone },
                                        { label: "Payout Requests", desc: "Notifications for pending withdrawals", icon: Lock },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all rounded-[1.5rem] group cursor-default">
                                            <div className="flex gap-6">
                                                <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.desc}</p>
                                                </div>
                                            </div>
                                            <Switch checked={i < 2} className="data-[state=checked]:bg-emerald-600" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="border-rose-100 rounded-[2.5rem] shadow-huge overflow-hidden">
                                <CardHeader className="bg-rose-50/30 border-b border-rose-100 px-10 py-8">
                                    <CardTitle className="text-xl font-black text-rose-950 uppercase tracking-tight flex items-center gap-3">
                                        <Shield className="h-6 w-6 text-rose-600" />
                                        Security Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-10 py-10 space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Session Length</label>
                                        <div className="relative group">
                                            <select className="w-full h-16 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-black text-slate-900 appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer">
                                                <option>24 Hours (Standard)</option>
                                                <option>7 Days (Stay Logged In)</option>
                                                <option>30 Days (Maximum Security Risk)</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                <RotateCcw className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-8 bg-slate-950 rounded-[2rem] text-white shadow-huge relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10">
                                            <p className="text-base font-black uppercase tracking-tight flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Require 2FA
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Enable Two-Factor Authentication for all admins</p>
                                        </div>
                                        <Switch checked className="data-[state=checked]:bg-emerald-500 relative z-10" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
