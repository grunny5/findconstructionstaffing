/**
 * Tests for email utility functions
 */

import { escapeHtml } from '../utils';

describe('Email Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('Smith & Sons')).toBe('Smith &amp; Sons');
    });

    it('should escape less-than signs', () => {
      expect(escapeHtml('Value < 100')).toBe('Value &lt; 100');
    });

    it('should escape greater-than signs', () => {
      expect(escapeHtml('Value > 50')).toBe('Value &gt; 50');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's working")).toBe('It&#039;s working');
    });

    it('should escape multiple special characters', () => {
      const input = 'Test & Construction <Special> "Agency"';
      const expected =
        'Test &amp; Construction &lt;Special&gt; &quot;Agency&quot;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle strings with no special characters', () => {
      const input = 'Regular Agency Name';
      expect(escapeHtml(input)).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should escape HTML tags', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should prevent HTML injection', () => {
      const maliciousInput = '<img src=x onerror="alert(\'XSS\')">';
      const escaped = escapeHtml(maliciousInput);

      // Verify that dangerous HTML is escaped
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#039;');

      // The full escaped string should be safe
      expect(escaped).toBe(
        '&lt;img src=x onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;'
      );
    });

    it('should handle consecutive special characters', () => {
      expect(escapeHtml('&&&')).toBe('&amp;&amp;&amp;');
      expect(escapeHtml('<<<')).toBe('&lt;&lt;&lt;');
    });

    it('should handle mixed case text with special characters', () => {
      const input = 'ABC & xyz <tag> "quote" \'apostrophe\'';
      const expected =
        'ABC &amp; xyz &lt;tag&gt; &quot;quote&quot; &#039;apostrophe&#039;';
      expect(escapeHtml(input)).toBe(expected);
    });
  });
});
