/**
 * Strip HTML to plain text for email clients that don't render HTML.
 * Used by both test-variations.js (local preview) and deploy.js (SendGrid upload).
 */
export function htmlToPlainText(html) {
  let text = html;
  // Remove style/script blocks
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Convert common block elements to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  // Convert links to "text (url)" format
  text = text.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, url, linkText) => {
    const clean = linkText.replace(/<[^>]+>/g, '').trim();
    return clean && clean !== url ? `${clean} (${url})` : url;
  });
  // Convert images to alt text
  text = text.replace(/<img[^>]+alt="([^"]*)"[^>]*>/gi, '[$1]');
  text = text.replace(/<img[^>]*>/gi, '');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#x200a;/gi, ' ');
  text = text.replace(/&#xA0;/gi, ' ');
  text = text.replace(/&[#\w]+;/g, ''); // remaining entities
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
