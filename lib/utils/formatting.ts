// Shared formatting utility functions

export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
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