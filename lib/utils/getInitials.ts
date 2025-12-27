/**
 * Extract initials from a person's name
 *
 * @param name - Full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD") or "?" if name is empty
 *
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "A"
 * getInitials("Mary Jane Watson") // "MW"
 * getInitials("") // "?"
 * getInitials("   ") // "?"
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();

  // Handle empty or whitespace-only names
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/);

  // Single word name
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? '?';
  }

  // Multiple word name: first + last
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];

  if (!firstInitial || !lastInitial) return '?';

  return (firstInitial + lastInitial).toUpperCase();
}
