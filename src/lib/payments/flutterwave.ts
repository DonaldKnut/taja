/**
 * Flutterwave Payment Integration
 * 
 * This module handles all Flutterwave payment operations including:
 * - Payment initialization
 * - Payment verification
 * - Escrow hold creation
 * - Bank transfers (payouts)
 * 
 * When you get your Flutterwave keys, just add them to .env.local:
 * - FLUTTERWAVE_PUBLIC_KEY=your_public_key
 * - FLUTTERWAVE_SECRET_KEY=your_secret_key
 * - FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key (optional)
 */

const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || "";
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY || "";
const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

interface FlutterwavePaymentRequest {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  fullname: string;
  tx_ref: string; // Unique transaction reference
  redirect_url: string;
  customer?: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    tx_ref: string;
  };
}

interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    card: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      token: string;
      expiry: string;
    };
    created_at: string;
    account_id: number;
    status: string;
    payment_type: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
  };
}

interface FlutterwaveTransferRequest {
  account_bank: string; // Bank code
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  beneficiary_name?: string;
}

interface FlutterwaveTransferResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}

/**
 * Check if Flutterwave is configured
 */
export function isFlutterwaveConfigured(): boolean {
  return !!(FLUTTERWAVE_PUBLIC_KEY && FLUTTERWAVE_SECRET_KEY);
}

/**
 * Initialize a payment with Flutterwave
 */
export async function initializeFlutterwavePayment(
  request: FlutterwavePaymentRequest
): Promise<FlutterwavePaymentResponse> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured. Please add FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY to your environment variables.");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      public_key: FLUTTERWAVE_PUBLIC_KEY,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to initialize Flutterwave payment");
  }

  return response.json();
}

/**
 * Verify a Flutterwave payment
 */
export async function verifyFlutterwavePayment(
  transactionId: string
): Promise<FlutterwaveVerifyResponse> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify Flutterwave payment");
  }

  return response.json();
}

/**
 * Verify payment by transaction reference
 */
export async function verifyFlutterwavePaymentByRef(
  txRef: string
): Promise<FlutterwaveVerifyResponse> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${txRef}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify Flutterwave payment");
  }

  return response.json();
}

/**
 * Transfer funds to a bank account (for seller payouts)
 */
export async function flutterwaveBankTransfer(
  request: FlutterwaveTransferRequest
): Promise<FlutterwaveTransferResponse> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
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
export async function getFlutterwaveBanks(country: string = "NG"): Promise<any> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/banks/${country}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
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
export async function verifyFlutterwaveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<any> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/accounts/resolve`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_number: accountNumber,
      account_bank: bankCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify bank account");
  }

  return response.json();
}

/**
 * Get transfer status
 */
export async function getFlutterwaveTransferStatus(transferId: string): Promise<any> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers/${transferId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get transfer status");
  }

  return response.json();
}





