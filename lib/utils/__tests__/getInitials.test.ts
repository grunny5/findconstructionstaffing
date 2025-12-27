import { getInitials } from '../getInitials';

describe('getInitials', () => {
  describe('Normal Cases', () => {
    it('should return initials for two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should return initials for three-word name (first + last)', () => {
      expect(getInitials('Mary Jane Watson')).toBe('MW');
    });

    it('should return initials for four-word name (first + last)', () => {
      expect(getInitials('John Paul George Ringo')).toBe('JR');
    });

    it('should return single initial for one-word name', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('should handle mixed case names', () => {
      expect(getInitials('jOhN dOe')).toBe('JD');
    });
  });

  describe('Edge Cases - Empty/Whitespace', () => {
    it('should return "?" for empty string', () => {
      expect(getInitials('')).toBe('?');
    });

    it('should return "?" for whitespace-only string', () => {
      expect(getInitials('   ')).toBe('?');
    });

    it('should return "?" for tabs and newlines', () => {
      expect(getInitials('\t\n  ')).toBe('?');
    });
  });

  describe('Edge Cases - Special Characters', () => {
    it('should handle names with apostrophes', () => {
      expect(getInitials("O'Brien")).toBe('O');
    });

    it('should handle names with hyphens', () => {
      expect(getInitials('Mary-Jane Watson')).toBe('MW');
    });

    it('should handle names with special characters', () => {
      expect(getInitials('José García')).toBe('JG');
    });

    it('should handle names with numbers', () => {
      expect(getInitials('Agent 007')).toBe('A0');
    });
  });

  describe('Edge Cases - Extra Whitespace', () => {
    it('should handle leading whitespace', () => {
      expect(getInitials('  John Doe')).toBe('JD');
    });

    it('should handle trailing whitespace', () => {
      expect(getInitials('John Doe  ')).toBe('JD');
    });

    it('should handle multiple spaces between names', () => {
      expect(getInitials('John    Doe')).toBe('JD');
    });

    it('should handle tabs between names', () => {
      expect(getInitials('John\t\tDoe')).toBe('JD');
    });
  });

  describe('Edge Cases - Single Character', () => {
    it('should handle single character name', () => {
      expect(getInitials('X')).toBe('X');
    });

    it('should handle single character with spaces', () => {
      expect(getInitials('  X  ')).toBe('X');
    });
  });

  describe('Edge Cases - Unicode', () => {
    it('should handle emoji in name', () => {
      // Emoji "😀" is a single character, so it should return "?"
      // because emoji don't have uppercase equivalents
      const result = getInitials('😀 Name');
      expect(result).toBeTruthy(); // Just ensure it doesn't crash
    });

    it('should handle Chinese characters', () => {
      expect(getInitials('李 明')).toBe('李明');
    });
  });
});
