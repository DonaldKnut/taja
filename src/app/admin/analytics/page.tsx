"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    DollarSign,
    Activity,
    Calendar,
    ArrowRight,
    ChevronDown,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const GrowthStat = ({ label, value, growth, icon: Icon, color }: any) => {
    const isPositive = growth > 0;
    return (
        <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500 group">
            <CardContent className="pt-8 pb-8 px-8">
                <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-400/10 text-emerald-600' : 'bg-rose-400/10 text-rose-600'}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(growth)}% Growth
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
};

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api("/api/admin/stats");
            if (response?.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const revenueData = [450, 520, 480, 610, 750, 890, 820];
    const maxRevenue = Math.max(...revenueData);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-10 p-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
                            <BarChart3 className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Intelligence</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Business Analytics</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <Calendar className="h-4 w-4" />
                            Past 30 Days
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                        <Button className="h-12 px-8 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-huge">
                            <Download className="h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <GrowthStat
                    label="Total Revenue"
                    value={`₦${stats?.revenue?.total ? (stats.revenue.total / 1000).toFixed(1) + 'k' : '1.2M'}`}
                    growth={14.2}
                    icon={DollarSign}
                    color="text-emerald-600 bg-emerald-600"
                />
                <GrowthStat
                    label="Transactions"
                    value={stats?.orders?.total || "842"}
                    growth={8.1}
                    icon={ShoppingCart}
                    color="text-blue-600 bg-blue-600"
                />
                <GrowthStat
                    label="New Users"
                    value={stats?.users?.total || "14.2k"}
                    growth={22.5}
                    icon={Users}
                    color="text-purple-600 bg-purple-600"
                />
                <GrowthStat
                    label="System Health"
                    value="98.2%"
                    growth={1.5}
                    icon={Activity}
                    color="text-rose-600 bg-rose-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart (Mock) */}
                <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                Revenue Trends
                            </CardTitle>
                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-2.5 hover:text-emerald-600 transition-colors cursor-pointer"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Volume</div>
                                <div className="flex items-center gap-2.5 hover:text-slate-900 transition-colors cursor-pointer"><div className="h-2 w-2 rounded-full bg-slate-200" /> Forecast</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-12 pb-10 px-10">
                        <div className="h-[300px] flex items-end justify-between gap-3 sm:gap-6">
                            {revenueData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer relative">
                                    <div className="absolute -top-12 bg-slate-950 text-white text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-2 whitespace-nowrap shadow-huge z-10 border border-emerald-500/20">
                                        ₦{val}k
                                    </div>
                                    <div
                                        className="w-full rounded-t-xl bg-slate-950/5 group-hover:bg-slate-950/10 transition-all duration-300 absolute inset-x-0 bottom-0 top-0 mb-12 rounded-b-xl"
                                    />
                                    <div
                                        className="w-full rounded-t-xl bg-gradient-to-t from-slate-950 to-emerald-600 relative transition-all duration-700 group-hover:scale-x-105 group-hover:brightness-125 shadow-huge"
                                        style={{ height: `${(val / maxRevenue) * 100}%` }}
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-full mx-1 mt-1" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-6 group-hover:text-slate-900 transition-colors">D{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* User Engagement */}
                <div className="space-y-8">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-huge overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                            <CardTitle className="text-base font-black text-slate-900 tracking-tight uppercase">User Segments</CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 py-8">
                            <div className="space-y-10">
                                {[
                                    { label: "Sellers", value: stats?.users?.sellers || 240, total: stats?.users?.total || 1000, color: "bg-emerald-600" },
                                    { label: "Customers", value: stats?.users?.buyers || 760, total: stats?.users?.total || 1000, color: "bg-indigo-600" },
                                    { label: "Observers", value: 120, total: 1000, color: "bg-slate-300" },
                                ].map((segment, i) => (
                                    <div key={i} className="space-y-3 group cursor-default">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{segment.label}</p>
                                                <p className="text-2xl font-black text-slate-950 mt-1 tracking-tighter">{segment.value}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                {Math.round((segment.value / segment.total) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className={`h-full ${segment.color} rounded-full transition-all duration-1000 group-hover:brightness-110`}
                                                style={{ width: `${(segment.value / segment.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-950 border-slate-900 text-white overflow-hidden relative rounded-[2.5rem] shadow-huge">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <Activity className="h-32 w-32 text-emerald-400" />
                        </div>
                        <CardContent className="pt-10 pb-10 px-10 relative z-10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Market Prediction</p>
                            <h4 className="text-3xl font-black mb-6 tracking-tight">+42.8% Expected Growth</h4>
                            <p className="text-sm text-slate-400 leading-relaxed mb-10 font-medium">
                                Market trends suggest a significant increase in fashion item sales for the next quarter.
                            </p>
                            <Button variant="ghost" className="text-emerald-400 hover:text-white hover:bg-white/5 px-6 py-6 rounded-2xl h-auto text-[10px] font-black uppercase tracking-[0.2em] group border border-emerald-500/20">
                                View Insights <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
