/**
 * Email utility functions
 */

/**
 * Escapes HTML special characters to prevent HTML injection.
 *
 * @param unsafe - The string to escape
 * @returns The escaped string safe for HTML insertion
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize a site URL to prevent unsafe schemes
 *
 * Ensures the URL uses a safe protocol (https:// or http://) and is a valid URL.
 * Falls back to a safe default if validation fails.
 *
 * @param siteUrl - The site URL to validate
 * @param fallback - Fallback URL if validation fails (default: https://findconstructionstaffing.com)
 * @returns The URL origin (scheme + host + port) only, without path, query string, or fragment.
 *          Returns the fallback origin if validation fails.
 * @example
 * validateSiteUrl('https://example.com/path?query=1#hash')
 * // Returns: 'https://example.com'
 *
 * validateSiteUrl('http://localhost:3000/dashboard')
 * // Returns: 'http://localhost:3000' (in development)
 *
 * validateSiteUrl('javascript:alert(1)')
 * // Returns: 'https://findconstructionstaffing.com' (fallback)
 */
export function validateSiteUrl(
  siteUrl: string,
  fallback = 'https://findconstructionstaffing.com'
): string {
  // Validate and normalize the fallback first
  let validatedFallbackOrigin: string;
  try {
    const fallbackUrl = new URL(fallback);
    if (fallbackUrl.protocol !== 'http:' && fallbackUrl.protocol !== 'https:') {
      validatedFallbackOrigin = 'https://findconstructionstaffing.com';
    } else {
      validatedFallbackOrigin = fallbackUrl.origin;
    }
  } catch {
    // If provided fallback is malformed, use hard-coded safe default
    validatedFallbackOrigin = 'https://findconstructionstaffing.com';
  }

  try {
    const url = new URL(siteUrl);

    // Only allow http and https schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.warn(
        `[Email Security] Unsafe URL scheme detected: ${url.protocol} on host ${url.hostname}. Falling back to: ${validatedFallbackOrigin}`
      );
      return validatedFallbackOrigin;
    }

    // For production, enforce HTTPS
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      console.warn(
        `[Email Security] Non-HTTPS URL in production: ${url.origin}. Falling back to: ${validatedFallbackOrigin}`
      );
      return validatedFallbackOrigin;
    }

    // Return the validated URL origin
    return url.origin;
  } catch (error) {
    console.warn(
      `[Email Security] Invalid URL provided. Falling back to: ${validatedFallbackOrigin}`
    );
    return validatedFallbackOrigin;
  }
}
