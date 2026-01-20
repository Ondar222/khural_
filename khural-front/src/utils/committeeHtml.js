import { decodeHtmlEntities } from "./html.js";

const ALLOWED_TAGS = new Set([
  "p",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
]);

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isProbablyHtml(input) {
  const s = String(input ?? "");
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

function isSafeHref(href) {
  const h = String(href || "").trim();
  if (!h) return false;
  if (h.startsWith("#")) return true;
  if (h.startsWith("/")) return true;
  if (h.startsWith("mailto:")) return true;
  if (h.startsWith("tel:")) return true;
  return /^https?:\/\//i.test(h);
}

function sanitizeWithDom(html) {
  // Browser-only sanitizer. If DOM isn't available, fall back to escaped text.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return escapeHtml(html).replace(/\n/g, "<br/>");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");

  // Remove dangerous nodes explicitly
  for (const bad of doc.querySelectorAll("script, style, iframe, object, embed")) {
    bad.remove();
  }

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const toProcess = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) toProcess.push(n);

  for (const el of toProcess) {
    const tag = String(el.tagName || "").toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // unwrap element, keep children
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      continue;
    }

    // Strip all attributes by default
    const attrs = Array.from(el.attributes || []);
    for (const a of attrs) el.removeAttribute(a.name);

    // Re-allow only safe attributes for links
    if (tag === "a") {
      const rawHref = el.getAttribute("href");
      const href = rawHref ? String(rawHref).trim() : "";
      if (isSafeHref(href)) {
        el.setAttribute("href", href);
      } else {
        el.removeAttribute("href");
      }

      const target = el.getAttribute("target");
      if (target === "_blank") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.removeAttribute("target");
        el.removeAttribute("rel");
      }
    }
  }

  return doc.body.innerHTML || "";
}

/**
 * Produces safe HTML string for rendering committee descriptions.
 * - If input looks like HTML: sanitize with allowlist.
 * - Else: escape as text and convert newlines to <br/>.
 */
export function toCommitteeHtml(input) {
  const decoded = decodeHtmlEntities(String(input ?? ""));
  if (!decoded) return "";
  if (isProbablyHtml(decoded)) return sanitizeWithDom(decoded);
  return escapeHtml(decoded).replace(/\n/g, "<br/>");
}

