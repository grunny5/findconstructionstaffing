/**
 * Email Domain Verification Utilities
 *
 * Utilities for verifying email domains match agency website domains.
 * Used in the agency claim request process to automatically verify ownership.
 */

/**
 * Extracts the domain from an email address
 *
 * @param email - The email address to extract domain from
 * @returns The domain portion of the email (e.g., "example.com" from "user@example.com")
 * @throws Error if email format is invalid
 *
 * @example
 * ```ts
 * extractEmailDomain("john@acmestaffing.com")
 * // Returns: "acmestaffing.com"
 * ```
 */
export function extractEmailDomain(email: string): string {
  const emailRegex = /^[^\s@]+@([^\s@]+)$/;
  const match = email.match(emailRegex);

  if (!match || !match[1]) {
    throw new Error('Invalid email format');
  }

  return match[1].toLowerCase();
}

/**
 * Extracts the domain from a website URL
 *
 * @param url - The website URL to extract domain from
 * @returns The domain portion of the URL without protocol or path
 * @throws Error if URL format is invalid
 *
 * @example
 * ```ts
 * extractWebsiteDomain("https://www.acmestaffing.com/about")
 * // Returns: "acmestaffing.com"
 *
 * extractWebsiteDomain("www.acmestaffing.com")
 * // Returns: "acmestaffing.com"
 * ```
 */
export function extractWebsiteDomain(url: string): string {
  try {
    // Remove protocol if present
    let cleanUrl = url.trim().toLowerCase();
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Remove path and query string
    const domainMatch = cleanUrl.match(/^([^\/\?#]+)/);

    if (!domainMatch || !domainMatch[1]) {
      throw new Error('Invalid URL format');
    }

    return domainMatch[1];
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Verifies if an email domain matches a website domain
 *
 * Performs case-insensitive comparison of email and website domains.
 * Handles common variations like www prefix and protocol differences.
 *
 * @param businessEmail - The business email address to verify
 * @param agencyWebsite - The agency's website URL (can be null)
 * @returns true if domains match, false otherwise
 *
 * @example
 * ```ts
 * verifyEmailDomain("john@acmestaffing.com", "https://www.acmestaffing.com")
 * // Returns: true
 *
 * verifyEmailDomain("john@gmail.com", "https://www.acmestaffing.com")
 * // Returns: false
 *
 * verifyEmailDomain("john@example.com", null)
 * // Returns: false (no website to compare)
 * ```
 */
export function verifyEmailDomain(
  businessEmail: string,
  agencyWebsite: string | null
): boolean {
  // Cannot verify if agency has no website
  if (!agencyWebsite) {
    return false;
  }

  try {
    const emailDomain = extractEmailDomain(businessEmail);
    const websiteDomain = extractWebsiteDomain(agencyWebsite);

    // Case-insensitive comparison
    return emailDomain === websiteDomain;
  } catch (error) {
    // If either domain extraction fails, verification fails
    return false;
  }
}

/**
 * Common free email domains that should not be used for business verification
 *
 * This list helps identify when users are trying to claim agencies with
 * personal email addresses that can't be verified against a business domain.
 */
export const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
] as const;

/**
 * Checks if an email uses a free email provider domain
 *
 * @param email - The email address to check
 * @returns true if the email uses a free provider, false otherwise
 *
 * @example
 * ```ts
 * isFreeEmailDomain("john@gmail.com")
 * // Returns: true
 *
 * isFreeEmailDomain("john@acmestaffing.com")
 * // Returns: false
 * ```
 */
export function isFreeEmailDomain(email: string): boolean {
  try {
    const domain = extractEmailDomain(email);
    return FREE_EMAIL_DOMAINS.includes(domain as any);
  } catch (error) {
    return false;
  }
}
