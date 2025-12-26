/**
 * @jest-environment node
 */

import {
  stripHtmlTags,
  containsXSS,
  sanitizeMessageContent,
  sanitizeMessagePreview,
  validateMessageContent,
} from '../sanitize';

describe('stripHtmlTags', () => {
  it('should remove simple HTML tags', () => {
    expect(stripHtmlTags('Hello <b>World</b>!')).toBe('Hello World!');
    expect(stripHtmlTags('<p>Test paragraph</p>')).toBe('Test paragraph');
    expect(stripHtmlTags('<div>Content</div>')).toBe('Content');
  });

  it('should remove nested HTML tags', () => {
    expect(stripHtmlTags('<div><p>Nested <b>tags</b></p></div>')).toBe(
      'Nested tags'
    );
    expect(stripHtmlTags('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe(
      'Item 1Item 2'
    );
  });

  it('should remove self-closing tags', () => {
    expect(stripHtmlTags('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    expect(stripHtmlTags('Image: <img src="test.jpg" />')).toBe('Image:');
  });

  it('should decode HTML entities', () => {
    expect(stripHtmlTags('5 &lt; 10')).toBe('5 < 10');
    expect(stripHtmlTags('A &amp; B')).toBe('A & B');
    expect(stripHtmlTags('&quot;quoted&quot;')).toBe('"quoted"');
    expect(stripHtmlTags('it&#x27;s')).toBe("it's");
  });

  it('should handle empty or null input', () => {
    expect(stripHtmlTags('')).toBe('');
    expect(stripHtmlTags('   ')).toBe('');
  });

  it('should preserve plain text without tags', () => {
    expect(stripHtmlTags('Hello World')).toBe('Hello World');
    expect(stripHtmlTags('123 Test 456')).toBe('123 Test 456');
  });

  it('should remove script tags', () => {
    expect(stripHtmlTags('<script>alert("XSS")</script>Safe')).toBe(
      'alert("XSS")Safe'
    );
  });
});

describe('containsXSS', () => {
  describe('Script tag detection', () => {
    it('should detect <script> tags', () => {
      expect(containsXSS('<script>alert(1)</script>')).toBe(true);
      expect(containsXSS('Hello <script>alert(1)</script> World')).toBe(true);
    });

    it('should detect <script> tags case-insensitively', () => {
      expect(containsXSS('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(containsXSS('<ScRiPt>alert(1)</ScRiPt>')).toBe(true);
    });

    it('should detect script tags with attributes', () => {
      expect(containsXSS('<script type="text/javascript">code</script>')).toBe(
        true
      );
    });
  });

  describe('Event handler detection', () => {
    it('should detect onclick', () => {
      expect(containsXSS('<div onclick="alert(1)">Click</div>')).toBe(true);
      expect(containsXSS('onclick="malicious()"')).toBe(true);
    });

    it('should detect onerror', () => {
      expect(containsXSS('<img onerror="alert(1)" src="x">')).toBe(true);
    });

    it('should detect onload', () => {
      expect(containsXSS('<body onload="hack()">')).toBe(true);
    });

    it('should detect onmouseover', () => {
      expect(containsXSS('<a onmouseover="steal()">Link</a>')).toBe(true);
    });

    it('should detect multiple event handlers', () => {
      expect(containsXSS('onfocus="a()" onblur="b()"')).toBe(true);
    });

    it('should detect event handlers case-insensitively', () => {
      expect(containsXSS('ONCLICK="alert(1)"')).toBe(true);
      expect(containsXSS('OnClick="alert(1)"')).toBe(true);
    });
  });

  describe('JavaScript URL detection', () => {
    it('should detect javascript: URLs', () => {
      expect(containsXSS('javascript:alert(1)')).toBe(true);
      expect(containsXSS('<a href="javascript:void(0)">Link</a>')).toBe(true);
    });

    it('should detect javascript: URLs case-insensitively', () => {
      expect(containsXSS('JAVASCRIPT:alert(1)')).toBe(true);
      expect(containsXSS('JavaScript:alert(1)')).toBe(true);
    });
  });

  describe('Safe content', () => {
    it('should return false for plain text', () => {
      expect(containsXSS('Hello World')).toBe(false);
      expect(containsXSS('This is a normal message')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(containsXSS('')).toBe(false);
      expect(containsXSS('   ')).toBe(false);
    });

    it('should return false for safe HTML', () => {
      expect(containsXSS('<p>Paragraph</p>')).toBe(false);
      expect(containsXSS('<b>Bold</b>')).toBe(false);
    });
  });
});

describe('sanitizeMessageContent', () => {
  it('should sanitize simple HTML', () => {
    expect(sanitizeMessageContent('<b>Bold</b> text')).toBe('Bold text');
    expect(sanitizeMessageContent('<p>Paragraph</p>')).toBe('Paragraph');
  });

  it('should remove XSS attempts', () => {
    // Script tags are stripped, leaving just the content (which is now safe text)
    const result1 = sanitizeMessageContent('<script>alert(1)</script>');
    expect(result1).toBe('alert(1)'); // Tags stripped, leaving safe text

    // Event handlers are stripped
    const result2 = sanitizeMessageContent('<div onclick="hack()">Text</div>');
    expect(result2).toBe('Text');
  });

  it('should handle empty input', () => {
    expect(sanitizeMessageContent('')).toBe('');
    expect(sanitizeMessageContent('   ')).toBe('');
  });

  it('should preserve safe plain text', () => {
    expect(sanitizeMessageContent('Hello World')).toBe('Hello World');
    expect(sanitizeMessageContent('123 Test Message')).toBe('123 Test Message');
  });

  it('should trim whitespace', () => {
    expect(sanitizeMessageContent('  Hello  ')).toBe('Hello');
    expect(sanitizeMessageContent('\n\nText\n\n')).toBe('Text');
  });

  it('should handle complex nested HTML', () => {
    const input = '<div><p>Hello <b>World</b>!</p></div>';
    expect(sanitizeMessageContent(input)).toBe('Hello World!');
  });
});

describe('sanitizeMessagePreview', () => {
  it('should truncate long messages', () => {
    const longMessage = 'a'.repeat(300);
    const preview = sanitizeMessagePreview(longMessage, 200);
    expect(preview.length).toBe(203); // 200 chars + '...'
    expect(preview.endsWith('...')).toBe(true);
  });

  it('should not truncate short messages', () => {
    const shortMessage = 'Hello World';
    expect(sanitizeMessagePreview(shortMessage, 200)).toBe('Hello World');
  });

  it('should sanitize and truncate', () => {
    const input = '<p>' + 'a'.repeat(300) + '</p>';
    const preview = sanitizeMessagePreview(input, 100);
    expect(preview.length).toBe(103); // 100 + '...'
    expect(preview.endsWith('...')).toBe(true);
    expect(preview.includes('<p>')).toBe(false);
  });

  it('should use default max length of 200', () => {
    const longMessage = 'a'.repeat(300);
    const preview = sanitizeMessagePreview(longMessage);
    expect(preview.length).toBe(203); // 200 + '...'
  });

  it('should handle empty input', () => {
    expect(sanitizeMessagePreview('')).toBe('');
  });

  it('should handle message at exact max length', () => {
    const message = 'a'.repeat(200);
    expect(sanitizeMessagePreview(message, 200)).toBe(message);
  });
});

describe('validateMessageContent', () => {
  describe('Valid content', () => {
    it('should accept valid plain text', () => {
      const result = validateMessageContent('Hello World');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message at min length', () => {
      const result = validateMessageContent('a', 1);
      expect(result.isValid).toBe(true);
    });

    it('should accept message at max length', () => {
      const result = validateMessageContent('a'.repeat(10000), 1, 10000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid content - Empty', () => {
    it('should reject empty string', () => {
      const result = validateMessageContent('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = validateMessageContent('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });
  });

  describe('Invalid content - Too short', () => {
    it('should reject message below min length', () => {
      const result = validateMessageContent('Hi', 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 5 character');
    });
  });

  describe('Invalid content - Too long', () => {
    it('should reject message above max length', () => {
      const result = validateMessageContent('a'.repeat(101), 1, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must not exceed 100 characters');
    });

    it('should reject message above default max (10000)', () => {
      const result = validateMessageContent('a'.repeat(10001));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must not exceed 10000 characters');
    });
  });

  describe('Invalid content - XSS', () => {
    it('should reject content with script tags', () => {
      const result = validateMessageContent('<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid HTML or scripts');
    });

    it('should reject content with event handlers', () => {
      const result = validateMessageContent('<img onclick="hack()" />');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid HTML or scripts');
    });

    it('should reject content with javascript: URLs', () => {
      const result = validateMessageContent('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid HTML or scripts');
    });
  });

  describe('Default parameters', () => {
    it('should use default min length of 1', () => {
      const result = validateMessageContent('a');
      expect(result.isValid).toBe(true);
    });

    it('should use default max length of 10000', () => {
      const result = validateMessageContent('a'.repeat(10000));
      expect(result.isValid).toBe(true);
    });
  });
});
