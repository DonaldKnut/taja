"use client";

import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface OrdersFiltersBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function OrdersFiltersBar({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  sortBy,
  onSortByChange,
}: OrdersFiltersBarProps) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-taja-primary/10 border border-taja-primary/20">
            <Package className="h-3 w-3 text-taja-primary" />
            <span className="text-[9px] font-black text-taja-primary uppercase tracking-[0.4em]">
              Order History
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter leading-none">
            My <br /> <span className="text-taja-primary">Orders</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-white/60 bg-white/30 backdrop-blur-md focus:bg-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-gray-400/50"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel p-2 rounded-[2rem] border-white/60 shadow-premium bg-white/50 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={dateRangeFilter}
              onChange={(e) => onDateRangeFilterChange(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="all">Date Range</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last Quarter</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/40 border-transparent focus:bg-white focus:border-taja-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-taja-secondary appearance-none cursor-pointer"
            >
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Price</option>
              <option value="lowest">Lowest Price</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
