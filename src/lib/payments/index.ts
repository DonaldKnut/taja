/**
 * Payment System - Main Entry Point
 * 
 * This module provides a unified interface for payment processing
 * across Flutterwave and Paystack.
 * 
 * Usage:
 * 1. Add your payment gateway keys to .env.local
 * 2. The system will automatically use the configured gateway
 * 3. If both are configured, you can specify which to use
 */

import * as flutterwave from "./flutterwave";
import * as paystack from "./paystack";
import * as escrow from "./escrow";

export { flutterwave, paystack, escrow };

export type PaymentProvider = "flutterwave" | "paystack";

/**
 * Get the default payment provider
 */
export function getDefaultPaymentProvider(): PaymentProvider | null {
  if (flutterwave.isFlutterwaveConfigured()) {
    return "flutterwave";
  }
  if (paystack.isPaystackConfigured()) {
    return "paystack";
  }
  return null;
}

/**
 * Check if any payment provider is configured
 */
export function isPaymentConfigured(): boolean {
  return flutterwave.isFlutterwaveConfigured() || paystack.isPaystackConfigured();
}

/**
 * Get configured payment providers
 */
export function getConfiguredProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  if (flutterwave.isFlutterwaveConfigured()) {
    providers.push("flutterwave");
  }
  if (paystack.isPaystackConfigured()) {
    providers.push("paystack");
  }
  return providers;
}

/**
 * Initialize payment (auto-selects configured provider)
 */
export async function initializePayment(
  provider: PaymentProvider | "auto",
  request: {
    amount: number;
    email: string;
    fullname: string;
    reference: string;
    redirectUrl: string;
    phone?: string;
    metadata?: Record<string, any>;
  }
) {
  let selectedProvider: PaymentProvider;

  if (provider === "auto") {
    const defaultProvider = getDefaultPaymentProvider();
    if (!defaultProvider) {
      throw new Error("No payment provider is configured. Please add Flutterwave or Paystack keys to your environment variables.");
    }
    selectedProvider = defaultProvider;
  } else {
    selectedProvider = provider;
  }

  if (selectedProvider === "flutterwave") {
    if (!flutterwave.isFlutterwaveConfigured()) {
      throw new Error("Flutterwave is not configured");
    }
    return flutterwave.initializeFlutterwavePayment({
      amount: request.amount,
      currency: "NGN",
      email: request.email,
      phone_number: request.phone,
      fullname: request.fullname,
      tx_ref: request.reference,
      redirect_url: request.redirectUrl,
      customer: {
        email: request.email,
        phonenumber: request.phone,
        name: request.fullname,
      },
      meta: request.metadata,
    });
  } else {
    if (!paystack.isPaystackConfigured()) {
      throw new Error("Paystack is not configured");
    }
    return paystack.initializePaystackPayment({
      email: request.email,
      amount: request.amount * 100, // Convert to kobo
      reference: request.reference,
      callback_url: request.redirectUrl,
      metadata: request.metadata,
    });
  }
}

/**
 * Verify payment (auto-selects configured provider)
 */
export async function verifyPayment(
  provider: PaymentProvider | "auto",
  reference: string
) {
  let selectedProvider: PaymentProvider;

  if (provider === "auto") {
    const defaultProvider = getDefaultPaymentProvider();
    if (!defaultProvider) {
      throw new Error("No payment provider is configured");
    }
    selectedProvider = defaultProvider;
  } else {
    selectedProvider = provider;
  }

  if (selectedProvider === "flutterwave") {
    return flutterwave.verifyFlutterwavePaymentByRef(reference);
  } else {
    return paystack.verifyPaystackPayment(reference);
  }
}

/**
 * Transfer funds to seller (for payouts)
 */
export async function transferToSeller(
  provider: PaymentProvider | "auto",
  request: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    recipientName: string;
    reference: string;
    narration?: string;
  }
) {
  let selectedProvider: PaymentProvider;

  if (provider === "auto") {
    const defaultProvider = getDefaultPaymentProvider();
    if (!defaultProvider) {
      throw new Error("No payment provider is configured");
    }
    selectedProvider = defaultProvider;
  } else {
    selectedProvider = provider;
  }

  if (selectedProvider === "flutterwave") {
    return flutterwave.flutterwaveBankTransfer({
      account_bank: request.bankCode,
      account_number: request.accountNumber,
      amount: request.amount,
      narration: request.narration || `Payment to ${request.recipientName}`,
      reference: request.reference,
      currency: "NGN",
      beneficiary_name: request.recipientName,
    });
  } else {
    // For Paystack, we need to create a recipient first
    const recipient = await paystack.createPaystackRecipient({
      type: "nuban",
      name: request.recipientName,
      account_number: request.accountNumber,
      bank_code: request.bankCode,
      currency: "NGN",
    });

    return paystack.paystackBankTransfer({
      source: "balance",
      amount: request.amount * 100, // Convert to kobo
      recipient: recipient.data.id.toString(),
      reason: request.narration || `Payment to ${request.recipientName}`,
      reference: request.reference,
      currency: "NGN",
    });
  }
}





