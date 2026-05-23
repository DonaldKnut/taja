export interface SuspiciousDetectionResult {
  detected: boolean;
  type: string;
  confidence: number;
}

export function detectSuspiciousPatterns(text: string): SuspiciousDetectionResult {
  const patterns = [
    { regex: /\b\d{10,}\b/g, type: "Account Number", confidence: 0.9 },
    {
      regex: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      type: "Phone Number",
      confidence: 0.85,
    },
    {
      regex: /\b(account|acct|acc)\s*(number|no|#)?\s*:?\s*\d+/gi,
      type: "Account Info",
      confidence: 0.95,
    },
    {
      regex: /\b(pay|send|transfer)\s+(to|me|direct|outside|offline)\b/gi,
      type: "Direct Payment Request",
      confidence: 0.75,
    },
    {
      regex: /\b(whatsapp|telegram|call\s+me|dm\s+me|text\s+me)\b/gi,
      type: "External Contact",
      confidence: 0.65,
    },
    {
      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      type: "Card Number",
      confidence: 0.95,
    },
    {
      regex:
        /\b(bank|routing|swift|iban|bvn|sort\s+code)\s*(number|no|code)?\s*:?\s*\d+/gi,
      type: "Banking Details",
      confidence: 0.92,
    },
    {
      regex: /\b(cash|meet|in\s+person|hand\s+to\s+hand)\b/gi,
      type: "Offline Transaction",
      confidence: 0.6,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return {
        detected: true,
        type: pattern.type,
        confidence: pattern.confidence,
      };
    }
  }

  return { detected: false, type: "", confidence: 0 };
}
