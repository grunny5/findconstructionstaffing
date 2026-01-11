/**
 * Slug validation utilities
 *
 * Shared validation for agency slugs across API endpoints.
 */

/**
 * Validates that a slug follows the expected format.
 *
 * Valid slugs are:
 * - Lowercase alphanumeric characters
 * - May contain hyphens (but not at start/end or consecutive)
 * - Between 1 and 100 characters
 *
 * Examples:
 * - Valid: "elite-construction", "abc-staffing-123", "acme"
 * - Invalid: "Elite-Construction", "abc--staffing", "-invalid", "with spaces"
 *
 * @param slug - The slug to validate
 * @returns true if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric with hyphens, no spaces or special chars
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}
