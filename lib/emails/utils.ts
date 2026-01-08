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
 * @returns A safe, validated URL
 */
export function validateSiteUrl(
  siteUrl: string,
  fallback = 'https://findconstructionstaffing.com'
): string {
  try {
    const url = new URL(siteUrl);

    // Only allow http and https schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.warn(
        `[Email Security] Unsafe URL scheme detected: ${url.protocol}. Falling back to: ${fallback}`
      );
      return fallback;
    }

    // For production, enforce HTTPS
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      console.warn(
        `[Email Security] Non-HTTPS URL in production: ${siteUrl}. Falling back to: ${fallback}`
      );
      return fallback;
    }

    // Return the validated URL origin
    return url.origin;
  } catch (error) {
    console.warn(
      `[Email Security] Invalid URL: ${siteUrl}. Falling back to: ${fallback}`
    );
    return fallback;
  }
}
