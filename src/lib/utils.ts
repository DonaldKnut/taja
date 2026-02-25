import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${amount ?? 0}`;
  }
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(
    num || 0
  );
}

export function timeAgo(date: Date | string | number) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(d);
}

/**
 * Normalize Nigerian phone number by removing spaces, dashes, and other formatting
 * @param phoneNumber - Phone number string (e.g., "+234 801 234 5678" or "08012345678")
 * @returns Normalized phone number (e.g., "+2348012345678" or "08012345678")
 */
export function normalizeNigerianPhone(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '').trim();
}

/**
 * Validate Nigerian phone number
 * Accepts formats: +2348012345678, 08012345678, +234 801 234 5678, etc.
 * @param phoneNumber - Phone number string to validate
 * @returns true if valid Nigerian phone number, false otherwise
 */
export function isValidNigerianPhone(phoneNumber: string): boolean {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  const normalized = normalizeNigerianPhone(phoneNumber);
  return phoneRegex.test(normalized);
}
