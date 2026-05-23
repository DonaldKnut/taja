/**
 * Nigerian Bank Code Mapping
 * 
 * Maps bank names to their codes for Flutterwave and Paystack transfers
 */

export const NIGERIAN_BANK_CODES: Record<string, string> = {
  // Flutterwave/Paystack Bank Codes
  "Access Bank": "044",
  "Access Bank (Diamond)": "063",
  "ALAT by WEMA": "035A",
  "ASO Savings and Loans": "401",
  "Bowen Microfinance Bank": "50931",
  "CEMCS Microfinance Bank": "50823",
  "Citibank Nigeria": "023",
  "Ecobank Nigeria": "050",
  "Ekondo Microfinance Bank": "562",
  "Fidelity Bank": "070",
  "First Bank of Nigeria": "011",
  "First City Monument Bank": "214",
  "Globus Bank": "00103",
  "Guaranty Trust Bank": "058",
  "Heritage Bank": "030",
  "Jaiz Bank": "301",
  "Keystone Bank": "082",
  "Kuda Bank": "50211",
  "Parallex Bank": "526",
  "Polaris Bank": "076",
  "Providus Bank": "101",
  "Rubies MFB": "125",
  "Sparkle Microfinance Bank": "51310",
  "Stanbic IBTC Bank": "221",
  "Standard Chartered Bank": "068",
  "Sterling Bank": "232",
  "Suntrust Bank": "100",
  "TAJ Bank": "302",
  "Titan Bank": "102",
  "Union Bank of Nigeria": "032",
  "United Bank For Africa": "033",
  "Unity Bank": "215",
  "VFD": "566",
  "Wema Bank": "035",
  "Zenith Bank": "057",
};

/**
 * Get bank code from bank name
 */
export function getBankCode(bankName: string): string | null {
  // Try exact match first
  if (NIGERIAN_BANK_CODES[bankName]) {
    return NIGERIAN_BANK_CODES[bankName];
  }

  // Try case-insensitive match
  const normalizedName = bankName.toLowerCase().trim();
  for (const [name, code] of Object.entries(NIGERIAN_BANK_CODES)) {
    if (name.toLowerCase() === normalizedName) {
      return code;
    }
  }

  // Try partial match (e.g., "GTB" matches "Guaranty Trust Bank")
  for (const [name, code] of Object.entries(NIGERIAN_BANK_CODES)) {
    if (
      name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(name.toLowerCase())
    ) {
      return code;
    }
  }

  return null;
}

/**
 * Get bank name from bank code
 */
export function getBankName(bankCode: string): string | null {
  for (const [name, code] of Object.entries(NIGERIAN_BANK_CODES)) {
    if (code === bankCode) {
      return name;
    }
  }
  return null;
}

/**
 * Get all banks as array
 */
export function getAllBanks(): Array<{ name: string; code: string }> {
  return Object.entries(NIGERIAN_BANK_CODES).map(([name, code]) => ({
    name,
    code,
  }));
}





