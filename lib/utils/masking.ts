/**
 * PII Masking Utilities
 *
 * Functions for masking personally identifiable information (PII)
 * in API responses to protect user privacy.
 */

/**
 * Mask email address (show first character + domain)
 *
 * @example
 * maskEmail("john@example.com") // "j***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***@***.com';
  const [local, domain] = email.split('@');
  // Don't leak PII - return masked format even for invalid emails
  if (!local || !domain) {
    return `${local?.[0] ?? '*'}***@***`;
  }
  return `${local[0]}***@${domain}`;
}

/**
 * Mask phone number (show only last 4 digits)
 *
 * @example
 * maskPhone("(555) 123-4567") // "***-***-4567"
 * maskPhone("5551234567")     // "***-***-4567"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***-***-****';
  // Extract only digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  // Show last 4 digits only
  const lastFour = digits.slice(-4);
  return `***-***-${lastFour}`;
}
