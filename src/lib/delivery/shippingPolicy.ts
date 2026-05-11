export type ShippingPayer = "buyer" | "seller" | "platform" | "split";

export type ShippingPolicyLike = {
  freeShipping?: boolean;
  shippingCost?: number;
  costPerKg?: number;
  weight?: number;
  lagosMainlandDelivery?: number | null;
  lagosIslandDelivery?: number | null;
  shippingPayer?: ShippingPayer;
};

export type ShippingPolicyValidationResult = {
  isValid: boolean;
  message?: string;
};

function toFiniteNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function validateShippingPolicy(policy: ShippingPolicyLike | undefined): ShippingPolicyValidationResult {
  const freeShipping = Boolean(policy?.freeShipping);
  const shippingCost = toFiniteNumber(policy?.shippingCost) ?? 0;
  const costPerKg = toFiniteNumber(policy?.costPerKg);
  const weight = toFiniteNumber(policy?.weight) ?? 0;
  const mainland = toFiniteNumber(policy?.lagosMainlandDelivery);
  const island = toFiniteNumber(policy?.lagosIslandDelivery);
  const payer = policy?.shippingPayer || "buyer";

  if (shippingCost < 0 || (costPerKg != null && costPerKg < 0) || (mainland != null && mainland < 0) || (island != null && island < 0)) {
    return { isValid: false, message: "Shipping values cannot be negative" };
  }

  const hasMainland = mainland != null;
  const hasIsland = island != null;
  if (hasMainland !== hasIsland) {
    return {
      isValid: false,
      message: "Set both Lagos Mainland and Island rates together, or leave both empty",
    };
  }

  if (freeShipping) {
    if (payer === "buyer") {
      return {
        isValid: false,
        message: "Free shipping cannot be billed to buyer. Choose seller, platform, or split sponsor",
      };
    }
    return { isValid: true };
  }

  const hasLagosPair = hasMainland && hasIsland;
  const hasFlatRate = shippingCost > 0;
  const hasWeightRate = (costPerKg ?? 0) > 0 && weight > 0;
  if ((costPerKg ?? 0) > 0 && weight <= 0) {
    return {
      isValid: false,
      message: "Weight-based delivery requires product weight greater than 0kg",
    };
  }

  if (!hasLagosPair && !hasFlatRate && !hasWeightRate) {
    return {
      isValid: false,
      message: "Set delivery fee, weight-based fee, or both Lagos rates (or enable free shipping)",
    };
  }

  return { isValid: true };
}

