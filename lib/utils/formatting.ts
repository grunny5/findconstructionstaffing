// Shared formatting utility functions

export const createSlug = (text: string): string => {
  // Input validation
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .trim()
    // Normalize Unicode characters (NFD = Canonical Decomposition)
    .normalize('NFD')
    // Remove diacritics/accents
    .replace(/[\u0300-\u036f]/g, '')
    // Replace any sequence of non-alphanumeric characters (except hyphens) with a single hyphen
    .replace(/[^a-z0-9\-]+/g, '-')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
};

export const formatPhoneNumber = (phone: string): string => {
  // Input validation
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it matches US phone number format (10 digits)
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  // Return original input if not a valid US phone number
  return phone;
};