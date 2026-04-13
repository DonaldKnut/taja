export type VatStatus = "unknown" | "not_registered" | "registered";

export interface ShopTaxProfileInput {
  vatStatus?: string;
  vatNumber?: string;
  firsTin?: string;
  collectVat?: boolean;
  vatRate?: number;
}

const DEFAULT_VAT_RATE = 0.075;

function cleanOptional(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeVatStatus(value: unknown): VatStatus {
  if (value === "registered" || value === "not_registered" || value === "unknown") {
    return value;
  }
  return "unknown";
}

export function sanitizeShopTaxProfile(input: unknown): ShopTaxProfileInput | undefined {
  if (!input || typeof input !== "object") return undefined;
  const profile = input as Record<string, unknown>;
  const vatStatus = normalizeVatStatus(profile.vatStatus);
  const vatNumber = cleanOptional(profile.vatNumber);
  const firsTin = cleanOptional(profile.firsTin);
  const collectVat = typeof profile.collectVat === "boolean" ? profile.collectVat : undefined;
  const incomingRate = Number(profile.vatRate);
  const vatRate =
    Number.isFinite(incomingRate) && incomingRate >= 0 && incomingRate <= 1
      ? incomingRate
      : undefined;

  return {
    vatStatus,
    vatNumber,
    firsTin,
    collectVat,
    vatRate,
  };
}

export function getShopVatContext(shop: { taxProfile?: ShopTaxProfileInput } | null | undefined) {
  const profile = shop?.taxProfile || {};
  const vatStatus = normalizeVatStatus(profile.vatStatus);
  const collectVat = profile.collectVat !== false;
  const vatRate =
    typeof profile.vatRate === "number" && profile.vatRate >= 0 && profile.vatRate <= 1
      ? profile.vatRate
      : DEFAULT_VAT_RATE;
  const appliesVat = vatStatus === "registered" && collectVat;

  return {
    appliesVat,
    vatStatus,
    vatRate,
    collectVat,
  };
}

export function calculateVatAmount(subtotal: number, shop: { taxProfile?: ShopTaxProfileInput } | null | undefined) {
  const ctx = getShopVatContext(shop);
  if (!ctx.appliesVat) {
    return { tax: 0, ...ctx };
  }
  return { tax: Math.round(subtotal * ctx.vatRate), ...ctx };
}

