import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/Product";

const DEDUPE_MAX_AGE_SEC = 12 * 60 * 60;

export function productViewDedupeCookieName(productId: string) {
  return `taja_pv_${String(productId)}`;
}

export type ProductViewHitResult = {
  views: number;
  /** When true, caller should set the dedupe cookie on the outgoing response. */
  setDedupeCookie: boolean;
};

/**
 * Increments `Product.views` once per browser per `DEDUPE_MAX_AGE_SEC` (httpOnly cookie),
 * unless `skipIncrement` (e.g. seller previewing their own listing).
 * Always returns the current view count from DB.
 */
export async function applyProductViewHit(
  request: NextRequest,
  productId: string,
  leanProduct: { views?: number },
  options: { skipIncrement?: boolean }
): Promise<ProductViewHitResult> {
  const id = String(productId);
  if (options.skipIncrement) {
    const fresh = await Product.findById(id).select("views").lean();
    return {
      views: Number((fresh as any)?.views ?? leanProduct.views ?? 0),
      setDedupeCookie: false,
    };
  }

  const cookieName = productViewDedupeCookieName(id);
  if (request.cookies.get(cookieName)?.value === "1") {
    const fresh = await Product.findById(id).select("views").lean();
    return {
      views: Number((fresh as any)?.views ?? leanProduct.views ?? 0),
      setDedupeCookie: false,
    };
  }

  await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });
  const fresh = await Product.findById(id).select("views").lean();
  return {
    views: Number((fresh as any)?.views ?? 0),
    setDedupeCookie: true,
  };
}

export function attachProductViewDedupeCookie(response: NextResponse, productId: string) {
  response.cookies.set(productViewDedupeCookieName(productId), "1", {
    maxAge: DEDUPE_MAX_AGE_SEC,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
