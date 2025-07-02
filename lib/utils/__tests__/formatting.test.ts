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
      expect(createSlug('test   multiple   spaces')).toBe(
        'test-multiple-spaces'
      );
    });

    it('should handle multiple hyphens', () => {
      expect(createSlug('test---multiple---hyphens')).toBe(
        'test-multiple-hyphens'
      );
    });

    it('should trim whitespace', () => {
      expect(createSlug('  test trim  ')).toBe('test-trim');
    });

    it('should handle empty string', () => {
      expect(createSlug('')).toBe('');
    });

    // New test cases for enhanced functionality
    it('should handle null and undefined inputs', () => {
      expect(createSlug(null as any)).toBe('');
      expect(createSlug(undefined as any)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(createSlug(123 as any)).toBe('');
      expect(createSlug({} as any)).toBe('');
      expect(createSlug([] as any)).toBe('');
    });

    it('should handle accented characters', () => {
      expect(createSlug('Café Résumé')).toBe('cafe-resume');
      expect(createSlug('Naïve façade')).toBe('naive-facade');
      expect(createSlug('El Niño')).toBe('el-nino');
    });

    it('should handle international characters', () => {
      expect(createSlug('Zürich München')).toBe('zurich-munchen');
      expect(createSlug('São Paulo')).toBe('sao-paulo');
      // Note: Ø is not decomposable in NFD, so it gets removed
      expect(createSlug('Øresund')).toBe('resund');
      // Alternative test with decomposable characters
      expect(createSlug('Åarhus')).toBe('aarhus');
    });

    it('should handle edge cases with special characters', () => {
      expect(createSlug('!!!Hello---World!!!')).toBe('hello-world');
      expect(createSlug('---test---')).toBe('test');
      expect(createSlug('   ---   ')).toBe('');
    });

    it('should handle mixed alphanumeric content', () => {
      expect(createSlug('Test123 ABC')).toBe('test123-abc');
      expect(createSlug('2024-Year Plan!')).toBe('2024-year-plan');
    });

    it('should preserve existing hyphens', () => {
      expect(createSlug('pre-existing-hyphens')).toBe('pre-existing-hyphens');
      expect(createSlug('mix-of spaces-and-hyphens')).toBe(
        'mix-of-spaces-and-hyphens'
      );
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
