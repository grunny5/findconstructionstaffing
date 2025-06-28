import { createSlug, formatPhoneNumber } from '../formatting';

describe('Formatting Utilities', () => {
  describe('createSlug', () => {
    it('should convert text to lowercase', () => {
      expect(createSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(createSlug('test with spaces')).toBe('test-with-spaces');
    });

    it('should remove special characters', () => {
      expect(createSlug('Hello! World@#$')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(createSlug('test   multiple   spaces')).toBe('test-multiple-spaces');
    });

    it('should handle multiple hyphens', () => {
      expect(createSlug('test---multiple---hyphens')).toBe('test-multiple-hyphens');
    });

    it('should trim whitespace', () => {
      expect(createSlug('  test trim  ')).toBe('test-trim');
    });

    it('should handle empty string', () => {
      expect(createSlug('')).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format valid 10-digit US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should handle phone numbers with existing formatting', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123.456.7890')).toBe('(123) 456-7890');
    });

    it('should return original input for invalid phone numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('12345678901')).toBe('12345678901'); // 11 digits
      expect(formatPhoneNumber('123456789')).toBe('123456789'); // 9 digits
    });

    it('should handle phone numbers with country code', () => {
      expect(formatPhoneNumber('+1 (123) 456-7890')).toBe('+1 (123) 456-7890');
      expect(formatPhoneNumber('1-123-456-7890')).toBe('1-123-456-7890');
    });

    it('should handle empty string', () => {
      expect(formatPhoneNumber('')).toBe('');
    });

    // New test cases for input validation
    it('should handle null and undefined inputs', () => {
      expect(formatPhoneNumber(null as any)).toBe('');
      expect(formatPhoneNumber(undefined as any)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(formatPhoneNumber(123 as any)).toBe('');
      expect(formatPhoneNumber({} as any)).toBe('');
      expect(formatPhoneNumber([] as any)).toBe('');
    });
  });
});