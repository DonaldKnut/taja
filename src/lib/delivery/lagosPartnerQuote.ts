/**
 * Lagos last-mile zone → fee lookup (config-only, no external API).
 * Rates are editorial; update LAGOS_DELIVERY_ENGINE_VERSION when you change the table.
 * Match: longest alias wins first (avoids "Oshodi" eating "Isheri Oshun").
 */

export const LAGOS_DELIVERY_ENGINE_VERSION = "lagos-zones-v1-2025.04";

export type LagosQuoteKind = "fixed" | "from" | "fallback";

export type LagosDeliveryQuote = {
  priceNgn: number;
  /** Human label for the matched corridor (not a raw partner name) */
  zoneLabel: string;
  kind: LagosQuoteKind;
  /** True when price is a floor / batching / route-dependent */
  isEstimate: boolean;
  /** Short line for checkout UI */
  buyerNote?: string;
  matchedAlias?: string;
  version: typeof LAGOS_DELIVERY_ENGINE_VERSION;
};

type ZoneDef = {
  price: number;
  label: string;
  aliases: string[];
  /** "from ₦X" style */
  from?: boolean;
  /** Shown as buyerNote when set */
  note?: string;
  /** Mark isEstimate */
  estimate?: boolean;
};

/** Order: later entries with same-length aliases are fine; we flatten then sort by alias length desc. */
const ZONES: ZoneDef[] = [
  {
    price: 3000,
    label: "Mainland (Zone A)",
    aliases: [
      "isheri oshun",
      "isheri-osun",
      "ejigbo",
      "idimu",
      "ipaja",
      "ikotun",
      "igando",
      "okota",
      "oshodi",
      "ajao estate",
      "aja estate",
      "shogunle",
    ],
  },
  {
    price: 3500,
    label: "Mainland (Zone B)",
    aliases: [
      "ikeja",
      "yaba",
      "ogba",
      "mushin",
      "surulere",
      "shomolu",
      "somolu",
      "fadeyi",
      "onipanu",
      "bariga",
      "lawanson",
    ],
  },
  {
    price: 4000,
    label: "Mainland (Zone C)",
    aliases: [
      "festac",
      "amuwo",
      "satellite",
      "navy town",
      "abulado",
      "abule ado",
      "ayobo",
      "akowonjo",
      "abulegba",
      "abule egba",
      "iyana ipaja",
      "iyana-ipaja",
      "meiran",
      "agege",
      "magodo",
      "maryland",
      "dopemu",
      "ketu",
      "alapere",
      "gbagada",
      "oworonshoki",
      "oworoshoki",
      "ojota",
    ],
  },
  {
    price: 5000,
    label: "Island & premium mainland",
    aliases: [
      "trade fair",
      "tradefair",
      "lagos island",
      "ebute metta",
      "ebute-metta",
      "lekki phase 1",
      "lekki phase one",
      "lekki ph 1",
      "victoria island",
      "ikoyi",
      "idumota",
      "lekki",
    ],
    note: "Island / premium routes may be batched; final timing confirmed after order.",
    estimate: true,
  },
  {
    price: 6000,
    label: "Far west (LASU / Iba corridor)",
    aliases: ["lasu", " iba", "iba ", "iba,", "iba.", "lasu iba"],
    note: "Far-route surcharge; fee confirmed with dispatch.",
    estimate: true,
  },
  {
    price: 5000,
    label: "Heavy-traffic / industrial corridor",
    aliases: [
      "ojo alaba",
      "alaba",
      "apapa",
      "mile 2",
      "mile2",
      "ajegunle",
      "okokomaiko",
      "okoko maiko",
    ],
    from: true,
    note: "From ₦5,000 depending on exact drop-off and routing; ops may adjust slightly.",
    estimate: true,
  },
];

const FALLBACK_LAGOS = 4000;

function normalizeAddressText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenZones(): Array<{
  alias: string;
  price: number;
  label: string;
  from?: boolean;
  note?: string;
  estimate?: boolean;
}> {
  const rows: Array<{
    alias: string;
    price: number;
    label: string;
    from?: boolean;
    note?: string;
    estimate?: boolean;
  }> = [];
  for (const z of ZONES) {
    for (const raw of z.aliases) {
      const alias = normalizeAddressText(raw);
      if (!alias) continue;
      rows.push({
        alias,
        price: z.price,
        label: z.label,
        from: z.from,
        note: z.note,
        estimate: z.estimate,
      });
    }
  }
  rows.sort((a, b) => b.alias.length - a.alias.length);
  return rows;
}

const FLAT = flattenZones();

function isLagosContext(state?: string, city?: string): boolean {
  const s = normalizeAddressText(`${state || ""} ${city || ""}`);
  return s.includes("lagos");
}

/**
 * Quote from free-text address (line1 + line2 + city).
 */
export function quoteLagosDeliveryAddress(parts: {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
}): LagosDeliveryQuote | null {
  if (!isLagosContext(parts.state, parts.city)) return null;

  const hay = normalizeAddressText(
    [parts.addressLine1, parts.addressLine2, parts.city, parts.state].filter(Boolean).join(" ")
  );
  if (!hay) {
    return {
      priceNgn: FALLBACK_LAGOS,
      zoneLabel: "Lagos (address incomplete)",
      kind: "fallback",
      isEstimate: true,
      buyerNote: "Add street and area so we can quote delivery accurately.",
      version: LAGOS_DELIVERY_ENGINE_VERSION,
    };
  }

  for (const row of FLAT) {
    if (hay.includes(row.alias)) {
      const kind: LagosQuoteKind = row.from ? "from" : "fixed";
      return {
        priceNgn: row.price,
        zoneLabel: row.label,
        kind,
        isEstimate: !!row.estimate || !!row.from,
        buyerNote: row.note,
        matchedAlias: row.alias,
        version: LAGOS_DELIVERY_ENGINE_VERSION,
      };
    }
  }

  return {
    priceNgn: FALLBACK_LAGOS,
    zoneLabel: "Lagos (area not auto-matched)",
    kind: "fallback",
    isEstimate: true,
    buyerNote:
      "Standard Lagos delivery estimate. Ops may confirm or adjust slightly after order based on exact location.",
    version: LAGOS_DELIVERY_ENGINE_VERSION,
  };
}
