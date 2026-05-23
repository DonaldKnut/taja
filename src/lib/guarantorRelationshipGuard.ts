/**
 * Guarantor must be someone who can formally vouch (employer, landlord, professional, etc.),
 * not a spouse or romantic partner. Shared by logistics dashboard + POST /api/logistics/guarantor.
 */

export const GUARANTOR_RELATIONSHIP_DISCLAIMER =
  "Your guarantor must be someone who can formally stand for you—such as an employer, landlord, senior colleague, lawyer, accountant, civil servant, or religious leader—not a spouse, fiancé(e), boyfriend, girlfriend, or similar personal relationship. We review submissions and may reject weak or misleading guarantors.";

const BLOCK_MESSAGE =
  "Spouse, partner, or similar relationship is not accepted. Describe a formal guarantor (e.g. employer, landlord, professional contact).";

/** Normalise for matching: lowercase, strip accents, collapse punctuation to spaces. */
function normaliseRelationship(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Romantic / spouse-style relationships are not valid guarantors for fleet trust.
 * Uses word-boundary style checks on tokenised text (handles "my wife", "ex-husband", etc.).
 */
export function getGuarantorRelationshipRejection(relationship: string): string | null {
  const n = normaliseRelationship(relationship);
  if (!n) return null;

  const spouseOrPartner =
    /\b(wives|wife|husbands|husband|spouses|spouse|hubby|wifey|girlfriends?|boyfriends?|fiances?|fiancees?|sweethearts?|lovers?)\b/i;
  const exSpouse = /\bex[\s-]?(wives|wife|husbands|husband|spouses|spouse)\b/i;

  if (spouseOrPartner.test(n) || exSpouse.test(n)) {
    return BLOCK_MESSAGE;
  }

  return null;
}
