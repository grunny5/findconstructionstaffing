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
