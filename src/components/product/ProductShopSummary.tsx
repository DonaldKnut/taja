"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";

interface ProductShopSummaryProps {
  product: any;
  fallbackImage: string;
}

export function ProductShopSummary({ product, fallbackImage }: ProductShopSummaryProps) {
  return (
    <>
      <Link
        href={`/shop/${product.shop.shopSlug}`}
        className="group flex items-center justify-between p-4 sm:p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white transition-all hover:shadow-xl hover:shadow-emerald-900/5"
      >
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-taja-light shrink-0">
            <Image
              src={product.shop.logo || product.shop.sellerAvatar || fallbackImage}
              alt={product.shop.shopName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="font-black text-taja-secondary group-hover:text-taja-primary transition-colors truncate">
                {product.shop.ownerName || product.shop.shopName}
              </h4>
              {product.shop.isVerified && (
                <div className="bg-emerald-500 rounded-full p-0.5">
                  <ShieldCheck className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Curating for <span className="text-emerald-600 italic">{product.shop.shopName}</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Followers</span>
                <span className="text-[10px] font-black text-taja-secondary">{product.shop.followers.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-gray-100" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Trust Score</span>
                <span className="text-[10px] font-black text-emerald-600">A+ Elite</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0 ml-2">
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/50">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-relaxed">
            Escrow Protected
            <br />
            Secure Payment
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-5 rounded-3xl bg-taja-primary/5 border border-taja-primary/10">
          <Truck className="w-6 h-6 text-taja-primary" />
          <p className="text-[10px] font-black text-taja-primary uppercase tracking-widest leading-relaxed">
            Doorstep Delivery
            <br />
            Tracking Included
          </p>
        </div>
      </div>
    </>
  );
}
