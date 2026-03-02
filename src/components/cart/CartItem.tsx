"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Package, AlertCircle } from "lucide-react";
import { useCartStore, type CartItem as CartItemType } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export interface CartItemProps {
  item: CartItemType;
  className?: string;
  showLink?: boolean;
  formatPrice?: (price: number) => string;
  imageSize?: number;
}

export function CartItem({
  item,
  className,
  showLink = true,
  formatPrice = (price) => `₦${price.toLocaleString()}`,
  imageSize = 90,
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const [inputValue, setInputValue] = useState(item.quantity.toString());

  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(val) || 0;

    setInputValue(val);

    if (num > item.stock) {
      updateQuantity(item._id, item.stock);
      setInputValue(item.stock.toString());
      toast.error(`Only ${item.stock} units in stock`, { id: 'stock-limit' });
    } else if (num > 0) {
      updateQuantity(item._id, num);
    }
  };

  const handleBlur = () => {
    let num = parseInt(inputValue) || 0;

    if (num < item.moq) {
      updateQuantity(item._id, item.moq);
      setInputValue(item.moq.toString());
      toast.error(`Minimum order is ${item.moq} units`, { id: 'moq-limit' });
    } else if (num > item.stock) {
      updateQuantity(item._id, item.stock);
      setInputValue(item.stock.toString());
    } else {
      setInputValue(num.toString());
    }
  };

  const increment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.quantity < item.stock) {
      updateQuantity(item._id, item.quantity + 1);
    } else {
      toast.error("Stock limit reached", { id: 'stock-limit' });
    }
  };

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.quantity > item.moq) {
      updateQuantity(item._id, item.quantity - 1);
    } else if (item.quantity === item.moq) {
      toast.error(`Minimum order is ${item.moq} units`, { id: 'moq-limit' });
    }
  };

  const content = (
    <div
      className={cn(
        "group relative flex items-center gap-5 p-4 rounded-[1.75rem] border border-gray-50 bg-white hover:border-emerald-100 hover:bg-emerald-50/10 transition-all duration-500",
        className
      )}
    >
      {/* Image */}
      <div
        className="relative flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 shadow-sm group-hover:shadow-md transition-all duration-500"
        style={{ width: imageSize, height: imageSize }}
      >
        {item.images && item.images[0] ? (
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes={`${imageSize}px`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                {item.title}
              </h3>
              {item.quantity < item.moq && (
                <span className="flex items-center gap-1 bg-rose-50 text-[8px] font-black text-rose-600 px-1.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-tight whitespace-nowrap">
                  <AlertCircle className="h-2 w-2" /> Min {item.moq}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[100px]">{item.seller}</span>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-1">
                  <Package className="h-2.5 w-2.5 text-slate-300" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">In Stock: {item.stock}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeItem(item._id);
            }}
            className="p-1.5 opacity-0 group-hover:opacity-100 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <p className="text-emerald-600 font-black text-xs tracking-tight">
              {formatPrice(item.price)}
            </p>
            {item.moq > 1 && (
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">MOQ: {item.moq}</span>
            )}
          </div>

          <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100/50">
            <button
              onClick={decrement}
              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all text-gray-400 hover:text-gray-900 shadow-none hover:shadow-sm disabled:opacity-30"
              disabled={item.quantity <= item.moq}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min={item.moq}
              max={item.stock}
              value={inputValue}
              onChange={handleQuantityChange}
              onBlur={handleBlur}
              className="text-[11px] font-black w-10 text-center text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={increment}
              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all text-gray-400 hover:text-gray-900 shadow-none hover:shadow-sm disabled:opacity-30"
              disabled={item.quantity >= item.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (showLink && item.shopSlug) {
    return (
      <Link href={`/product/${item._id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
