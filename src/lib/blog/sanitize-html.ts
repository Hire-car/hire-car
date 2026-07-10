/** Allowed tags in AI-generated blog HTML. */
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote", "a", "strong", "b", "em", "i", "br",
  "img", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "td", "th"
]);

/** Strip dangerous content from AI-generated HTML before persistence/render. */
export function sanitizeBlogHtml(raw: string): string {
  if (!raw) return "";

  let html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Remove disallowed tags but keep inner text for block-level replacements
  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) {
      return "";
    }

    if (lower === "a") {
      const hrefMatch = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "";
      if (!href.startsWith("/") && !href.startsWith("http://") && !href.startsWith("https://")) {
        return match.startsWith("</") ? "</a>" : "<a>";
      }
      const safeHref = href.replace(/"/g, "&quot;");
      return match.startsWith("</") ? "</a>" : `<a href="${safeHref}">`;
    }

    if (lower === "img") {
      const srcMatch = attrs.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const altMatch = attrs.match(/\salt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const src = srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? "";
      const alt = altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? "";
      if (!src.startsWith("/") && !src.startsWith("http://") && !src.startsWith("https://")) {
        return "";
      }
      const safeSrc = src.replace(/"/g, "&quot;");
      const safeAlt = alt.replace(/"/g, "&quot;");
      return `<img src="${safeSrc}" alt="${safeAlt}">`;
    }

    if (lower === "td" || lower === "th") {
      const colMatch = attrs.match(/\scolspan\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rowMatch = attrs.match(/\srowspan\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const colspan = colMatch?.[2] ?? colMatch?.[3] ?? colMatch?.[4] ?? "";
      const rowspan = rowMatch?.[2] ?? rowMatch?.[3] ?? rowMatch?.[4] ?? "";
      let res = `<${lower}`;
      if (colspan && /^\d+$/.test(colspan)) res += ` colspan="${colspan}"`;
      if (rowspan && /^\d+$/.test(rowspan)) res += ` rowspan="${rowspan}"`;
      res += ">";
      return match.startsWith("</") ? `</${lower}>` : res;
    }

    // Optional: Keep classes for figure to support CKEditor image alignment
    if (lower === "figure") {
      const classMatch = attrs.match(/\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const cls = classMatch?.[2] ?? classMatch?.[3] ?? classMatch?.[4] ?? "";
      if (cls && (cls.includes("image") || cls.includes("table"))) {
        const safeCls = cls.replace(/"/g, "&quot;").replace(/[^\w\s-]/g, "");
        return match.startsWith("</") ? `</${lower}>` : `<${lower} class="${safeCls}">`;
      }
    }

    return match.startsWith("</") ? `</${lower}>` : `<${lower}>`;
  });

  return html.trim();
}
