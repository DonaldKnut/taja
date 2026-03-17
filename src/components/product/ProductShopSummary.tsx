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
        className="group flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white transition-all hover:shadow-xl hover:shadow-emerald-900/5"
      >
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-taja-light">
            <Image
              src={product.shop.logo || product.shop.sellerAvatar || fallbackImage}
              alt={product.shop.shopName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-taja-secondary group-hover:text-taja-primary transition-colors">
                {product.shop.ownerName || product.shop.shopName}
              </h4>
              {product.shop.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Shop: <span className="text-taja-secondary group-hover:text-taja-primary transition-colors">{product.shop.shopName}</span>
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {product.shop.followers.toLocaleString()} Collectors • Level 5 Partner
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/50">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-relaxed">
            Escrow Protected
            <br />
            Secure Payment
          </p>
        </div>
        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-taja-primary/5 border border-taja-primary/10">
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
