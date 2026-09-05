/**
 * Strict URL validator to neutralize JavaScript URI XSS vectors.
 */
export function sanitizeWebUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Text sanitizer to strip non-printable control characters.
 */
export function sanitizePlainText(input?: string | null, maxLength = 250): string {
  if (!input) return '';
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}