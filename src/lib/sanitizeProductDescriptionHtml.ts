const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
]);

function sanitizeWithDomParser(raw: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(walk).join("");

    if (!ALLOWED_TAGS.has(tag)) {
      return children;
    }
    if (tag === "br") {
      return "<br>";
    }
    return `<${tag}>${children}</${tag}>`;
  };

  return Array.from(doc.body.childNodes).map(walk).join("");
}

/** Sanitized HTML safe for product descriptions (rich text from admin/seller). */
export function sanitizeProductDescriptionHtml(html: string): string {
  const raw = (html ?? "").trim();
  if (!raw) return "";
  // Avoid server-side jsdom dependency issues in Next dev on Windows.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return plainTextToRichHtml(productDescriptionPlainText(raw));
  }
  return sanitizeWithDomParser(raw);
}

/** True when Quill / HTML editor has no meaningful content. */
export function isRichTextDescriptionEmpty(html: string): boolean {
  const t = (html || "")
    .replace(/\s|&nbsp;/gi, "")
    .replace(/<p><br\s*\/?><\/p>/gi, "")
    .replace(/<p><\/p>/gi, "");
  return !t;
}

export function looksLikeHtmlDescription(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s ?? "");
}

/** Turn plain text (e.g. AI output) into minimal safe HTML for Quill. */
/** Strip tags for meta / JSON-LD (not security-critical; use sanitize for HTML output). */
export function productDescriptionPlainText(html: string): string {
  const raw = (html ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function plainTextToRichHtml(text: string): string {
  const raw = (text ?? "").trim();
  if (!raw) return "";
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const parts = escaped.split(/\n\s*\n/).filter(Boolean);
  if (parts.length <= 1) {
    return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
  }
  return parts.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}
