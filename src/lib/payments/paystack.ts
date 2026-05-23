/**
 * Paystack Payment Integration
 * 
 * This module handles all Paystack payment operations including:
 * - Payment initialization
 * - Payment verification
 * - Bank transfers (payouts)
 * 
 * When you get your Paystack keys, just add them to .env.local:
 * - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_public_key (for client-side)
 * - PAYSTACK_SECRET_KEY=your_secret_key (for server-side)
 */

// Public key: prefer NEXT_PUBLIC_ for client; server can use PAYSTACK_PUBLIC_KEY (e.g. wallet fund uses only secret)
const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
  process.env.PAYSTACK_PUBLIC_KEY ||
  "";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

interface PaystackPaymentRequest {
  email: string;
  amount: number; // Amount in kobo (smallest currency unit)
  reference: string; // Unique transaction reference
  callback_url?: string;
  metadata?: Record<string, any>;
  currency?: string;
  channels?: string[]; // e.g., ["card", "bank", "ussd", "qr", "mobile_money"]
}

interface PaystackPaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

interface PaystackTransferRequest {
  source: string; // "balance" for transfers from balance
  amount: number; // Amount in kobo
  recipient: string; // Transfer recipient code
  reason?: string;
  reference?: string;
  currency?: string;
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface PaystackRecipientRequest {
  type: string; // "nuban" for Nigerian banks
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    type: string;
    updatedAt: string;
    details: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

/**
 * Check if Paystack is configured
 */
export function isPaystackConfigured(): boolean {
  return !!(PAYSTACK_PUBLIC_KEY && PAYSTACK_SECRET_KEY);
}

/**
 * Initialize a payment with Paystack
 */
export async function initializePaystackPayment(
  request: PaystackPaymentRequest
): Promise<PaystackPaymentResponse> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured. Please add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to your environment variables.");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      currency: request.currency || "NGN",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to initialize Paystack payment");
  }

  return response.json();
}

/**
 * Verify a Paystack payment
 */
export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify Paystack payment");
  }

  return response.json();
}

/**
 * Create a transfer recipient (for seller payouts)
 */
export async function createPaystackRecipient(
  request: PaystackRecipientRequest
): Promise<PaystackRecipientResponse> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create transfer recipient");
  }

  return response.json();
}

/**
 * Transfer funds to a recipient (for seller payouts)
 */
export async function paystackBankTransfer(
  request: PaystackTransferRequest
): Promise<PaystackTransferResponse> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      currency: request.currency || "NGN",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to process bank transfer");
  }

  return response.json();
}

/**
 * Get bank list for transfers
 */
export async function getPaystackBanks(): Promise<any> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch banks");
  }

  return response.json();
}

/**
 * Verify bank account details before transfer
 */
export async function verifyPaystackBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<any> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify bank account");
  }

  return response.json();
}

/**
 * Get transfer status
 */
export async function getPaystackTransferStatus(transferCode: string): Promise<any> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/${transferCode}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get transfer status");
  }

  return response.json();
}





