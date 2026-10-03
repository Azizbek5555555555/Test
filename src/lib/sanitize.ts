import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Admin/o'qituvchi kiritgan HTML'ni (maqola matni, test passage) sahifaga chiqarishdan oldin tozalaydi.
 *
 * Nega kerak: bu matnlar `dangerouslySetInnerHTML` bilan chiziladi. Agar o'qituvchi akkaunti
 * buzilsa yoki SQL orqali yomon matn kirib qolsa, unga `<script>`, `onerror=...` yoki
 * `javascript:` havola qo'shib, boshqa foydalanuvchilarning sessiyasini o'g'irlash mumkin
 * (stored XSS). Shu yerda faqat ruxsat etilgan teglar va atributlar qoladi, qolgani olib tashlanadi.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "div", "span",
    "h2", "h3", "h4", "h5",
    "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup", "code",
    "blockquote", "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "a", "img", "figure", "figcaption",
  ],
  allowedAttributes: {
    "*": ["class"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    ol: ["start", "type"],
  },
  // Faqat xavfsiz protokollar — `javascript:` va `data:` havolalar o'chiriladi
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  // Tashqi havolalar yangi oynada va sahifamizga kirish huquqisiz ochiladi
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer nofollow", ...(attribs.target ? { target: "_blank" } : {}) },
    }),
  },
};

export function sanitizeRichText(html: string | null | undefined): string | null {
  if (!html) return html ?? null;
  return sanitizeHtml(html, OPTIONS);
}
